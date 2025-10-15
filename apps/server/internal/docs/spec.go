package docs

var openAPISpec = []byte(`{
  "openapi": "3.0.3",
  "info": {
    "title": "Admin Service API",
    "description": "Internal admin platform API documentation.",
    "version": "0.1.0"
  },
  "servers": [
    { "url": "http://localhost:8000", "description": "Local development" }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "security": [
    { "BearerAuth": [] }
  ],
  "paths": {
    "/healthz": {
      "get": {
        "summary": "Service health probe",
        "responses": {
          "200": { "description": "service is healthy" }
        }
      }
    },
    "/api/v1/auth/login": {
      "post": {
        "summary": "Obtain JWT token",
        "description": "Authenticates a user and returns a JWT token.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "username": { "type": "string" },
                  "password": { "type": "string", "format": "password" }
                },
                "required": ["username", "password"]
              }
            }
          }
        },
        "responses": {
          "200": { "description": "token issued" },
          "400": { "description": "invalid request body" },
          "401": { "description": "invalid credentials" }
        }
      }
    },
    "/api/v1/auth/captcha": {
      "get": {
        "summary": "Generate captcha challenge",
        "description": "Returns a captcha identifier and an image encoded as base64 data URI.",
        "responses": {
          "200": {
            "description": "captcha created",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": { "type": "integer", "example": 200 },
                    "msg": { "type": "string", "example": "OK" },
                    "data": {
                      "type": "object",
                      "properties": {
                        "captcha_id": { "type": "string" },
                        "image": { "type": "string", "format": "byte" },
                        "expires_in": { "type": "integer", "format": "int64", "description": "seconds until expiration" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/system/users": {
      "get": {
        "summary": "List system users",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": { "description": "list response" },
          "401": { "description": "missing or invalid credentials" },
          "403": { "description": "insufficient permissions" }
        }
      }
    }
  }
}`)

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
