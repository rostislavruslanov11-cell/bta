// Google Apps Script — бэкенд за формой записи.
// Изпълнява се от името на собственика на скрипта (твоя Google акаунт),
// затова няма нужда от service account или споделяне на календара.

var CALENDAR_ID = 'primary'; // или конкретен Calendar ID, ако не е основният календар
var TIMEZONE = 'Europe/Sofia';
var WORK_START_HOUR = 9;
var WORK_END_HOUR = 19;

// Продължителност на услугите в минути — имената трябва да съвпадат
// със стойността на value в <select> в public/index.html
var SERVICES = {
  therapeutic: { label: 'Терапевтичен масаж', duration: 60 },
  myofascial: { label: 'Миофасциален масаж', duration: 60 },
  relax: { label: 'Възстановяващ/релакс масаж', duration: 60 },
  smartrf: { label: 'Smart RF', duration: 45 },
  hivamat: { label: 'HIVAMAT (дълбока осцилация)', duration: 45 },
  consult: { label: 'Консултация', duration: 20 },
};

function jsonResponse(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function isValidPhone(phone) {
  return /^[0-9+()\s-]{6,20}$/.test(phone);
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'Невалидна заявка.' });
  }

  var name = (data.name || '').trim();
  var phone = (data.phone || '').trim();
  var service = data.service;
  var date = data.date; // YYYY-MM-DD
  var time = data.time; // HH:mm

  if (!name) return jsonResponse({ error: 'Липсва име.' });
  if (!phone || !isValidPhone(phone)) return jsonResponse({ error: 'Невалиден телефонен номер.' });
  if (!service || !SERVICES[service]) return jsonResponse({ error: 'Невалидна услуга.' });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonResponse({ error: 'Невалидна дата.' });
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return jsonResponse({ error: 'Невалиден час.' });

  var hour = parseInt(time.slice(0, 2), 10);
  if (hour < WORK_START_HOUR || hour >= WORK_END_HOUR) {
    return jsonResponse({ error: 'Работно време: ' + WORK_START_HOUR + ':00–' + WORK_END_HOUR + ':00.' });
  }

  var svc = SERVICES[service];
  var start = new Date(date + 'T' + time + ':00');
  var end = new Date(start.getTime() + svc.duration * 60000);

  var calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();

  // Проверка на заетост, за да не се дублира час
  var existingEvents = calendar.getEvents(start, end);
  if (existingEvents.length > 0) {
    return jsonResponse({ error: 'Този час вече е зает. Моля, избери друг.' });
  }

  calendar.createEvent(
    svc.label + ' — ' + name,
    start,
    end,
    { description: 'Телефон: ' + phone + '\nУслуга: ' + svc.label }
  );

  return jsonResponse({ ok: true });
}

function doGet(e) {
  return jsonResponse({ ok: true, message: 'Pure Beauty booking endpoint работи.' });
}
