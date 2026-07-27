const form = document.getElementById('booking-form');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submit-btn');

// Не позволяваме резервация за минала дата
document.getElementById('date').min = new Date().toISOString().slice(0, 10);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = '';
  statusEl.className = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Изпращане...';

  const payload = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    service: form.service.value,
    date: form.date.value,
    time: form.time.value,
  };

  try {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      statusEl.textContent = 'Резервацията е успешна! Ще се видим скоро.';
      statusEl.className = 'success';
      form.reset();
    } else {
      statusEl.textContent = data.error || 'Възникна грешка. Опитай отново.';
      statusEl.className = 'error';
    }
  } catch (err) {
    statusEl.textContent = 'Проблем с връзката. Провери интернета и опитай отново.';
    statusEl.className = 'error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Резервирай';
  }
});
