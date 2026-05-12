export function GET() {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mazzotini Rooms — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0b0b0b;
      color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      min-height: 100vh;
    }

    /* Topo com logo */
    .docs-header {
      background: linear-gradient(to bottom, #111, #0b0b0b);
      border-bottom: 1px solid #2a2218;
      padding: 16px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .docs-header img { height: 40px; }
    .docs-header h1 { font-size: 18px; font-weight: 600; color: #C5A47E; letter-spacing: 0.3px; }
    .docs-header span { font-size: 12px; color: #64748b; margin-left: 8px; }

    /* Swagger UI overrides — dark mode */
    #swagger-ui { padding: 24px 16px 64px; max-width: 1100px; margin: 0 auto; }

    .swagger-ui .topbar { display: none; }

    .swagger-ui,
    .swagger-ui .wrapper,
    .swagger-ui .opblock-tag,
    .swagger-ui .opblock .opblock-summary-description,
    .swagger-ui .info .title,
    .swagger-ui .info p,
    .swagger-ui .info li,
    .swagger-ui table thead tr th,
    .swagger-ui .parameter__name,
    .swagger-ui .parameter__type,
    .swagger-ui label,
    .swagger-ui .response-col_status,
    .swagger-ui .tab li,
    .swagger-ui select,
    .swagger-ui input[type=text],
    .swagger-ui textarea { color: #cbd5e1; }

    .swagger-ui .scheme-container,
    .swagger-ui .opblock,
    .swagger-ui .opblock .opblock-summary,
    .swagger-ui .model-box,
    .swagger-ui section.models,
    .swagger-ui .response-col_description,
    .swagger-ui table.responses-table { background: transparent; }

    .swagger-ui .info { margin-bottom: 32px; }
    .swagger-ui .info .title { color: #C5A47E; font-size: 28px; }
    .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8; }

    .swagger-ui .opblock-tag {
      border-bottom: 1px solid #1e293b;
      color: #C5A47E !important;
      font-size: 18px;
    }
    .swagger-ui .opblock-tag:hover { background: #0f172a; }

    .swagger-ui .opblock {
      border-radius: 8px !important;
      border: 1px solid #1e293b !important;
      margin-bottom: 8px;
      box-shadow: none !important;
    }
    .swagger-ui .opblock .opblock-summary {
      border-radius: 8px !important;
    }

    /* Cores dos métodos */
    .swagger-ui .opblock.opblock-get    { background: #0d1f2d !important; border-color: #1d4ed8 !important; }
    .swagger-ui .opblock.opblock-post   { background: #0d2118 !important; border-color: #15803d !important; }
    .swagger-ui .opblock.opblock-put    { background: #1c1407 !important; border-color: #b45309 !important; }
    .swagger-ui .opblock.opblock-patch  { background: #130d20 !important; border-color: #7c3aed !important; }
    .swagger-ui .opblock.opblock-delete { background: #200d0d !important; border-color: #b91c1c !important; }

    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 4px !important;
      font-size: 12px !important;
      min-width: 68px;
    }

    .swagger-ui .opblock-body { background: #0f172a !important; border-top: 1px solid #1e293b; border-radius: 0 0 8px 8px !important; }

    .swagger-ui .parameters-container,
    .swagger-ui .responses-wrapper,
    .swagger-ui .request-body { background: transparent; }

    .swagger-ui input[type=text],
    .swagger-ui textarea,
    .swagger-ui select {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 6px !important;
      color: #e2e8f0 !important;
    }

    .swagger-ui .btn { border-radius: 6px !important; }
    .swagger-ui .btn.execute { background: #C5A47E !important; border-color: #C5A47E !important; color: #0b0b0b !important; font-weight: 600; }
    .swagger-ui .btn.cancel  { background: transparent !important; border-color: #475569 !important; color: #94a3b8 !important; }

    .swagger-ui .response-col_status { font-weight: 700; }

    .swagger-ui table.model tbody tr td,
    .swagger-ui table tbody tr td { border-color: #1e293b; background: transparent; }

    .swagger-ui .model-title { color: #C5A47E; }
    .swagger-ui .model { color: #94a3b8; }

    .swagger-ui section.models { border: 1px solid #1e293b; border-radius: 8px; background: #0f172a !important; }
    .swagger-ui section.models h4 { color: #C5A47E; }

    .swagger-ui .scheme-container { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <header class="docs-header">
    <img src="/logo.png" alt="Mazzotini" onerror="this.style.display='none'" />
    <div>
      <h1>Mazzotini Rooms <span>API v1.0</span></h1>
    </div>
  </header>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/api/swagger',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
        deepLinking: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        syntaxHighlight: { theme: 'monokai' },
        tryItOutEnabled: false,
      });
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
