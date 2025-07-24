function initAutocomplete() {
  const addrInput = document.getElementById("address-input");
  if (!addrInput) return;

  const autocomplete = new google.maps.places.Autocomplete(addrInput, {
    types: ["address"],
    componentRestrictions: { country: "us" },
  });

  let lat = null, lng = null, state = null;

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;
    lat = place.geometry.location.lat();
    lng = place.geometry.location.lng();
    const comp = place.address_components.find(c => c.types.includes("administrative_area_level_1"));
    state = comp?.short_name || null;
  });

  const form = document.getElementById("plan-form");
  const btn  = form.querySelector("button");
  const note = document.getElementById("notification");

  function notify(msg, type="info") {
    note.textContent = msg;
    note.className = "notification " + type;
    note.style.display = "block";
    setTimeout(() => note.style.display = "none", 6000);
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const address = addrInput.value.trim();
    const email   = document.getElementById("email-input").value.trim();
    if (!address || !email) {
      notify("Address and email are required", "error"); return;
    }
    if (lat == null || !state) {
      notify("Please select a valid address", "error"); return;
    }
    btn.textContent = "Generating...";
    btn.disabled = true;
    notify("Report is being generated…", "info");

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, email, lat, lng, state })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      notify(body.message, "success");
      form.reset();
      lat = lng = state = null;
    } catch (err) {
      console.error(err);
      notify("Error: " + err.message, "error");
    } finally {
      btn.textContent = "Get PDF Report";
      btn.disabled = false;
    }
  });
}

window.initAutocomplete = initAutocomplete;
