// Инициализируем Google Places Autocomplete
function initAutocomplete() {
  const addressInput = document.getElementById('address-input');
  if (!addressInput) return;

  const autocomplete = new google.maps.places.Autocomplete(addressInput, {
    types: ['address'],
    componentRestrictions: { country: 'us' },
  });

  let placeLat = null;
  let placeLng = null;
  let placeState = null;

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;

    placeLat = place.geometry.location.lat();
    placeLng = place.geometry.location.lng();

    // достаём short_name штата из компонентов адреса
    const comp = place.address_components.find(c =>
      c.types.includes('administrative_area_level_1')
    );
    placeState = comp ? comp.short_name : null;
  });

  // Основной обработчик формы
  const planForm = document.getElementById('plan-form');
  const button   = planForm.querySelector('button');
  const note     = document.getElementById('notification');

  function showNotification(message, type) {
    note.textContent = message;
    note.className = 'notification ' + type;
    note.style.display = 'block';
    setTimeout(() => note.style.display = 'none', 6000);
  }

  planForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const address = addressInput.value.trim();
    const email   = document.getElementById('email-input').value.trim();

    if (!address || !email) {
      showNotification('Please enter both address and email.', 'error');
      return;
    }
    if (placeLat == null || !placeState) {
      showNotification('Please select a valid address from suggestions.', 'error');
      return;
    }

    button.textContent = 'Generating...';
    button.disabled = true;
    showNotification('Report is being generated…', 'info');

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          email,
          lat: placeLat,
          lng: placeLng,
          state: placeState
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unknown error');

      showNotification(result.message, 'success');
      planForm.reset();
      // сбросим данные геолокации
      placeLat = placeLng = placeState = null;
    } catch (err) {
      console.error(err);
      showNotification(`Error: ${err.message}`, 'error');
    } finally {
      button.textContent = 'Get PDF Report';
      button.disabled = false;
    }
  });
}

// Запускаем автокомплит после загрузки Google Maps
window.initAutocomplete = initAutocomplete;
