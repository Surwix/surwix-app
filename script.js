function initAutocomplete() {
  const addressInput = document.getElementById('address-input');
  if (addressInput) {
    new google.maps.places.Autocomplete(addressInput, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
    });
  }
}

const planForm = document.getElementById('plan-form');
const button = planForm.querySelector('button');
const notification = document.getElementById('notification');

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = 'notification ' + type; 
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 6000);
}

// --- ОСНОВНОЙ ОБРАБОТЧИК С ДИАГНОСТИКОЙ ---
planForm.addEventListener('submit', async function(event) {
  event.preventDefault(); 
  console.log('[DEBUG] Submit event triggered.'); // 1. Проверяем, что обработчик запустился

  const address = document.getElementById('address-input').value;
  const email = document.getElementById('email-input').value;
  console.log(`[DEBUG] Address: ${address}, Email: ${email}`); // 2. Проверяем, что данные получены

  button.textContent = 'Generating...';
  button.disabled = true;

  try {
    console.log('[DEBUG] Inside try block, right before fetch...'); // 3. Проверяем, что мы дошли до отправки

    const response = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, email })
    });

    console.log('[DEBUG] Fetch call completed. Response status:', response.status); // 4. Проверяем, что fetch завершился

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'An unknown error occurred.');
    }

    showNotification(result.message, 'success');
    planForm.reset();

  } catch (error) {
    console.error('[DEBUG] CATCH BLOCK ERROR:', error); // 5. Ловим любую ошибку
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    console.log('[DEBUG] Finally block executed.'); // 6. Проверяем, что код дошел до конца
    button.textContent = 'Get PDF Report';
    button.disabled = false;
  }
});
