function initAutocomplete() {
  const addressInput = document.getElementById('address-input');
  if (addressInput) {
    new google.maps.places.Autocomplete(addressInput, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
    });
  }
}

// Находим все нужные элементы на странице
const planForm = document.getElementById('plan-form');
const button = planForm.querySelector('button');
const notification = document.getElementById('notification');

// Функция для показа уведомлений
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = 'notification ' + type; 
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 6000);
}

// Обработчик отправки формы
planForm.addEventListener('submit', async function(event) {
  event.preventDefault(); // Предотвращаем стандартную перезагрузку

  const address = document.getElementById('address-input').value;
  const email = document.getElementById('email-input').value;
  // ✅ НОВАЯ ПРОВЕРКА: Получаем состояние чекбокса
  const terms = document.getElementById('terms-checkbox').checked;

  if (!address || !email) {
    showNotification('Please fill in both the address and email fields.', 'error');
    return;
  }
  
  // ✅ НОВАЯ ПРОВЕРКА: Если галочка не стоит, показываем ошибку и выходим
  if (!terms) {
    showNotification('Please agree to the Terms of Use to proceed.', 'error');
    return;
  }

  // Блокируем кнопку на время запроса
  button.textContent = 'Generating...';
  button.disabled = true;
  notification.style.display = 'none';

  try {
    const response = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, email })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'An unknown error occurred.');
    }

    showNotification(result.message, 'success');
    planForm.reset(); // Очищаем форму

  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
    console.error('Fetch error:', error);
  } finally {
    // Возвращаем кнопку в исходное состояние
    button.textContent = 'Get PDF Report';
    button.disabled = false;
  }
});

// Запускаем автозаполнение адреса
initAutocomplete();
