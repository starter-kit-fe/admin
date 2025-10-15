package docs

import (
	_ "embed"
)

//go:generate go run github.com/swaggo/swag/cmd/swag@v1.16.1 init --parseDependency --parseInternal --dir ../handler,../router --generalInfo ../router/router.go --output .

//go:embed swagger.json
var openAPISpec []byte

const swaggerPage = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Admin Service API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: '/docs/openapi.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: "BaseLayout"
        });
      };
    </script>
  </body>
</html>`

func OpenAPISpec() []byte {
	return openAPISpec
}

func SwaggerHTML() []byte {
	return []byte(swaggerPage)
}
