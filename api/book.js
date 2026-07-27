const { google } = require('googleapis');

const TIMEZONE = 'Europe/Sofia';

// Длительность услуг в минутах — правь свободно, названия должны совпадать
// со значением value у <option> в public/index.html
const SERVICES = {
  therapeutic: { label: 'Терапевтичен масаж', duration: 60 },
  myofascial: { label: 'Миофасциален масаж', duration: 60 },
  relax: { label: 'Възстановяващ/релакс масаж', duration: 60 },
  smartrf: { label: 'Smart RF', duration: 45 },
  hivamat: { label: 'HIVAMAT (дълбока осцилация)', duration: 45 },
  consult: { label: 'Консултация', duration: 20 },
};

// Рабочие часы — простая проверка, без учёта отпусков/праздников
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 19;

function getCalendarClient() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/calendar']
  );
  return google.calendar({ version: 'v3', auth });
}

function addMinutes(dateStr, timeStr, minutes) {
  // Считаем в синтетическом UTC — нужна только корректная арифметика часов/минут,
  // абсолютное время не используется (в календарь дата/время уходят наивными + timeZone).
  const start = new Date(`${dateStr}T${timeStr}:00Z`);
  const end = new Date(start.getTime() + minutes * 60000);
  const endDate = end.toISOString().slice(0, 10);
  const endTime = end.toISOString().slice(11, 16);
  return { endDate, endTime };
}

function isValidPhone(phone) {
  return /^[0-9+()\s-]{6,20}$/.test(phone);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, phone, service, date, time } = req.body || {};

  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'Липсва име.' });
    return;
  }
  if (!phone || !isValidPhone(phone)) {
    res.status(400).json({ error: 'Невалиден телефонен номер.' });
    return;
  }
  if (!service || !SERVICES[service]) {
    res.status(400).json({ error: 'Невалидна услуга.' });
    return;
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Невалидна дата.' });
    return;
  }
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    res.status(400).json({ error: 'Невалиден час.' });
    return;
  }

  const hour = parseInt(time.slice(0, 2), 10);
  if (hour < WORK_START_HOUR || hour >= WORK_END_HOUR) {
    res.status(400).json({ error: `Работно време: ${WORK_START_HOUR}:00–${WORK_END_HOUR}:00.` });
    return;
  }

  const svc = SERVICES[service];
  const { endDate, endTime } = addMinutes(date, time, svc.duration);
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    res.status(500).json({ error: 'Сървърът не е конфигуриран (липсват Google Calendar credentials).' });
    return;
  }

  let calendar;
  try {
    calendar = getCalendarClient();
  } catch (e) {
    res.status(500).json({ error: 'Грешка при връзка с календара.' });
    return;
  }

  const startDateTime = `${date}T${time}:00`;
  const endDateTime = `${endDate}T${endTime}:00`;

  try {
    // Проверка на заетост, за да не се дублира час
    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDateTime,
        timeMax: endDateTime,
        timeZone: TIMEZONE,
        items: [{ id: calendarId }],
      },
    });
    const busy = fb.data.calendars?.[calendarId]?.busy || [];
    if (busy.length > 0) {
      res.status(409).json({ error: 'Този час вече е зает. Моля, избери друг.' });
      return;
    }

    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `${svc.label} — ${name}`,
        description: `Телефон: ${phone}\nУслуга: ${svc.label}`,
        start: { dateTime: startDateTime, timeZone: TIMEZONE },
        end: { dateTime: endDateTime, timeZone: TIMEZONE },
      },
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Грешка при запис. Опитай отново или се свържи директно.' });
  }
};
