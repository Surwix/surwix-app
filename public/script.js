// Журнал загрузки
console.log('[script.js] Loaded ✅');

function initAutocomplete() {
  console.log('[initAutocomplete] called');
  const addressInput = document.getElementById('address-input');
  if (addressInput) {
    // современный Place Autocomplete Element
    new google.maps.places.Autocomplete(addressInput, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
    });
  }
}

// Элементы формы
const planForm = document.getElementById('plan-form');
const button = planForm.querySelector('button[type="submit"]');
const notification = document.getElementById('notification');

function showNotification(message, type) {
  notification.textContent = message;
  notification.className = 'notification ' + type;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
    notification.textContent = '';
    notification.className = 'notification';
  }, 6000);
}

// Отправка формы
planForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  console.log('[plan-form] submit handler');

  const address = document.getElementById('address-input').value;
  const email = document.getElementById('email-input').value;

  // Заблокировать кнопку
  button.textContent = 'Generating...';
  button.disabled = true;

  // Инфо-уведомление
  showNotification('Generating report... Please wait.', 'info');

  try {
    const response = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, email }),
    });

    const result = await response.json();
    console.log('[plan-form] response:', response.status, result);

    if (!response.ok) {
      throw new Error(result.message || 'Unknown error');
    }

    showNotification(result.message, 'success');
    planForm.reset();
  } catch (err) {
    console.error('[plan-form] Error:', err);
    showNotification(`Error: ${err.message}`, 'error');
  } finally {
    button.textContent = 'Get PDF Report';
    button.disabled = false;
  }
});
