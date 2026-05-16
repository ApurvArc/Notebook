const errorResponse = {
  description: "Error response",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
};

const noteResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Note" },
    },
  },
});

const buildOpenApiSpec = (baseUrl) => ({
  openapi: "3.0.4",
  info: {
    title: "Notes API",
    description:
      "A multi-user Notes REST API for registration, login, note CRUD, sharing, pinning, tags, pagination, and search.",
    version: "1.0.0",
    contact: {
      name: "Apurv",
      email: "apurv@example.com",
    },
  },
  servers: [
    {
      url: baseUrl || "http://localhost:5000",
      description: "Active server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Note: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          content: { type: "string" },
          is_pinned: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          409: errorResponse,
          422: errorResponse,
        },
      },
    },
    "/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    access_token: { type: "string" },
                  },
                },
              },
            },
          },
          401: errorResponse,
          422: errorResponse,
        },
      },
    },
    "/notes": {
      get: {
        tags: ["Notes"],
        summary: "Get all notes created by the authenticated user",
        description:
          "Returns notes owned by the authenticated user. Supports optional pagination and tag filtering.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
        ],
        responses: {
          200: {
            description: "List of notes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Note" },
                },
              },
            },
          },
          401: errorResponse,
        },
      },
      post: {
        tags: ["Notes"],
        summary: "Create a new note",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "content"],
                properties: {
                  title: { type: "string", maxLength: 200 },
                  content: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: noteResponse("Note created"),
          401: errorResponse,
          422: errorResponse,
        },
      },
    },
    "/notes/{id}": {
      get: {
        tags: ["Notes"],
        summary: "Get a specific note by ID",
        description: "Owners and users the note was shared with can read it.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: noteResponse("Note found"),
          400: errorResponse,
          401: errorResponse,
          404: errorResponse,
        },
      },
      put: {
        tags: ["Notes"],
        summary: "Update a note",
        description: "Only the owner can update a note.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", maxLength: 200 },
                  content: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: noteResponse("Note updated"),
          400: errorResponse,
          401: errorResponse,
          404: errorResponse,
          422: errorResponse,
        },
      },
      delete: {
        tags: ["Notes"],
        summary: "Delete a note",
        description: "Only the owner can delete a note.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Note deleted successfully" },
          400: errorResponse,
          401: errorResponse,
          404: errorResponse,
        },
      },
    },
    "/notes/{id}/share": {
      post: {
        tags: ["Notes"],
        summary: "Share a note with another user",
        description: "Only the owner can share a note.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["share_with_email"],
                properties: {
                  share_with_email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Note shared successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
          404: errorResponse,
          409: errorResponse,
          422: errorResponse,
        },
      },
    },
    "/notes/{id}/pin": {
      patch: {
        tags: ["Notes", "Custom Feature"],
        summary: "Toggle pin status of a note",
        description: "Custom feature. Only the owner can pin or unpin a note.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Pin status toggled",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    note: { $ref: "#/components/schemas/Note" },
                  },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
          404: errorResponse,
        },
      },
    },
    "/search": {
      get: {
        tags: ["Notes"],
        summary: "Full-text search across accessible notes",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Note" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
          400: errorResponse,
          401: errorResponse,
        },
      },
    },
    "/openapi.json": {
      get: {
        tags: ["Meta"],
        summary: "OpenAPI specification",
        responses: {
          200: { description: "OpenAPI JSON spec" },
        },
      },
    },
    "/about": {
      get: {
        tags: ["Meta"],
        summary: "About this API",
        responses: {
          200: {
            description: "Author and feature information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    "my features": { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export default buildOpenApiSpec;
