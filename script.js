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
  // Auto-hide notification after 10 seconds
  setTimeout(() => {
    notification.style.display = 'none';
    notification.textContent = '';
    notification.className = 'notification';
  }, 6000);
}

planForm.addEventListener('submit', async function(event) {
  event.preventDefault();
  const address = document.getElementById('address-input').value;
  const email = document.getElementById('email-input').value;

  button.textContent = 'Generating...';
  button.disabled = true;

  showNotification('Generating your evacuation report. Please wait...', 'info');

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

    showNotification('✅ Success! Your report has been sent to your email.', 'success');
    planForm.reset();
  } catch (error) {
    showNotification(`❌ Error: ${error.message}`, 'error');
  } finally {
    button.textContent = 'Get PDF Report';
    button.disabled = false;
  }
});
