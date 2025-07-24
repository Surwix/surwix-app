function createPdfHtml(data) {
  // helper для генерации строк «Risk Matrix»
  const riskRows = (data.risks || []).map(risk => `
    <tr>
      <td>${risk.type}</td>
      <td class="level level-${risk.level_color}">${risk.level_text}</td>
      <td>${risk.advice}</td>
      <td>${risk.probability || ''}</td>
    </tr>
  `).join('');

  // строки для OpenFEMA
  const disasterRows = (data.disasters || []).map(d =>
    `<li>${d.incidentType}, ${d.declarationDate} (${d.designation})</li>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Personal Evacuation Report by Surwix</title>
  <style>
    /* ─── Общие стили ─────────────────────────────────── */
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; padding:0; background:#f4f7f9; }
    .container { max-width:800px; margin:30px auto; background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden; }
    h1, h2, h3 { margin:0; }
    p, li { margin:0; }

    /* ─── Header ─────────────────────────────────────── */
    .header { background:#003366; color:#fff; padding:20px 24px; display:flex; align-items:center; justify-content:space-between; }
    .header .title { font-size:28px; font-weight:600; }
    .header .by { font-size:16px; margin-left:8px; display:flex; align-items:center; }
    .header .by img { height:24px; margin-left:4px; }

    .meta { display:flex; padding:16px 24px; border-bottom:1px solid #e2e8f0; font-size:14px; color:#7281a0; }
    .meta span { margin-right:32px; }

    /* ─── Summary ────────────────────────────────────── */
    .summary { display:flex; align-items:center; background:#fff7ec; border-left:8px solid #ed8936; padding:16px 24px; font-size:18px; }
    .summary .main { font-weight:600; color:#ed8936; margin-right:12px; }
    .summary .sub { color:#555; font-size:15px; }

    /* ─── Risk Matrix ───────────────────────────────── */
    .section { padding:24px; }
    .section + .section { border-top:1px solid #e2e8f0; }
    h2 { font-size:22px; color:#003366; margin-bottom:16px; }

    table { width:100%; border-collapse:collapse; }
    th, td { padding:12px; border-bottom:1px solid #e2e8f0; text-align:left; }
    th { background:#f1f4f9; color:#1a365d; font-weight:500; }
    .level-low    { color:#38a169; font-weight:600; }
    .level-medium { color:#ed8936; font-weight:600; }
    .level-high   { color:#e53e3e; font-weight:600; }

    /* ─── Badges ────────────────────────────────────── */
    .badge { display:inline-block; font-size:13px; color:#4682b4; border:1px solid #bdd3ee;
             background:#eef6fa; border-radius:5px; padding:2px 6px; margin-left:8px; }

    /* ─── FEMA / OpenFEMA / NOAA секции ────────────── */
    .fema, .openfema, .noaa { background:#f9fbfe; border:1px solid #e5ecf6;
      border-radius:8px; padding:16px; margin-bottom:24px; }
    .fema h3, .openfema h3, .noaa h3 { font-size:18px; margin-bottom:8px; }
    .fema p, .openfema p, .noaa p { font-size:15px; margin-bottom:6px; }
    .fema .badge, .openfema .badge, .noaa .badge { margin-left:12px; }

    /* ─── Lists ─────────────────────────────────────── */
    ul { padding-left:20px; margin-bottom:12px; }
    li { margin-bottom:6px; font-size:15px; }

    /* ─── Footer ────────────────────────────────────── */
    .footer { text-align:center; font-size:12px; color:#7a8597;
      padding:16px 24px; border-top:1px solid #e5ecf6; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="title">Personal Evacuation Report</div>
      <div class="by">by <img src="https://your.cdn/path/to/your-logo.png" alt="Surwix Logo"></div>
    </div>

    <!-- Meta -->
    <div class="meta">
      <span><strong>Address:</strong> ${data.address}</span>
      <span><strong>Date:</strong> ${data.report_date}</span>
      <span><strong>Report ID:</strong> ${data.report_id}</span>
    </div>

    <!-- Summary -->
    <div class="summary">
      <div class="main">Overall Risk: ${data.risk_level_text}</div>
      <div class="sub">${data.risk_comment}</div>
    </div>

    <!-- Hazard Risk Matrix -->
    <div class="section">
      <h2>Hazard Risk Matrix</h2>
      <table>
        <thead>
          <tr><th>Threat</th><th>Level</th><th>Advice</th><th>Probability</th></tr>
        </thead>
        <tbody>${riskRows}</tbody>
      </table>
    </div>

    <!-- Flood Risk (FEMA) -->
    <div class="section fema">
      <h3>Flood Risk <span class="badge">FEMA</span></h3>
      <p><strong>Flood Zone:</strong> ${data.floodZone}</p>
      <p>1% annual risk, not required by federal mortgage.</p>
      <p class="source">Source: FEMA Flood Map Service Center</p>
    </div>

    <!-- Recent Disasters (OpenFEMA) -->
    <div class="section openfema">
      <h3>Recent Disasters <span class="badge">OpenFEMA</span></h3>
      <ul>${disasterRows}</ul>
      <p class="source">Source: OpenFEMA.gov</p>
    </div>

    <!-- Storm/Tornado Stats (NOAA) -->
    <div class="section noaa">
      <h3>Storm/Tornado Stats <span class="badge">NOAA</span></h3>
      <p>${data.stormStats}</p>
      <p class="source">Source: NOAA / National Weather Service</p>
    </div>

    <!-- Emergency Resources & Checklist & AI Tips & History можно по аналогии ... -->

    <!-- Footer -->
    <div class="footer">
      Data for risk analysis provided by FEMA, OpenFEMA, and NOAA.  
      This report is generated by Surwix AI using government and open data.  
      Not a legal notice. Always follow instructions from local authorities.
    </div>
  </div>
</body>
</html>`;
}
