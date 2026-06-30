import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller to serve Swagger JSON specification and interactive UI HTML.
 */
export const swaggerController = {
  /**
   * Serves the OpenAPI/Swagger JSON configuration
   */
  getSwaggerJson(req, res) {
    const jsonPath = path.join(__dirname, '..', 'config', 'swagger.json');
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ message: 'Swagger specification file not found.' });
    }
    const data = fs.readFileSync(jsonPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.parse(data));
  },

  /**
   * Serves the Swagger UI HTML page
   */
  getSwaggerHtml(req, res) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Edge Route Vision (ERV) API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" sizes="32x32" />
        <style>
          html { box-sizing: border-box; overflow: -y-scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin: 0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              url: '/api/v1/docs/swagger.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: "BaseLayout"
            });
          };
        </script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
};
