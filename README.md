# Notes API

A multi-user Notes REST API built with **Node.js**, **Express 5**, and **MongoDB**.  
Supports JWT authentication, full CRUD on notes, sharing, pinning, full-text search, pagination, and OpenAPI docs.

**Live URL:** [https://notebook-o5yg.onrender.com](https://notebook-o5yg.onrender.com)  
**OpenAPI Spec:** [https://notebook-o5yg.onrender.com/openapi.json](https://notebook-o5yg.onrender.com/openapi.json)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Local Setup](#local-setup)
4. [Environment Variables](#environment-variables)
5. [API Reference](#api-reference)
6. [Custom Feature — Pin Notes](#custom-feature--pin-notes)
7. [Stretch Goals Implemented](#stretch-goals-implemented)
8. [Docker](#docker)
9. [Deploy to Render](#deploy-to-render)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) + bcryptjs |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Logging | morgan (dev only) |
| Containerisation | Docker (node:20-alpine) |

---

## Project Structure

```
.
├── server/
│   ├── configs/
│   │   ├── db.js          # MongoDB connection
│   │   └── env.js         # Env variable validation
│   ├── controllers/
│   │   ├── authController.js
│   │   └── notesController.js
│   ├── middleware/
│   │   ├── auth.js        # JWT protect middleware
│   │   ├── rateLimiter.js # express-rate-limit configs
│   │   └── validate.js    # express-validator error handler
│   ├── models/
│   │   ├── Note.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── notesRoutes.js
│   ├── utils/
│   │   └── openapi.js     # OpenAPI 3.0 spec builder
│   └── server.js          # Entry point
├── .env.example
├── Dockerfile
└── package.json
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- A MongoDB connection string (free tier at [MongoDB Atlas](https://www.mongodb.com/atlas))

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd notes-api

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Then edit .env and fill in MONGO_URI and JWT_SECRET

# 4. Start the development server (auto-restarts on changes)
npm run dev
```

The server starts at **`http://localhost:5000`** by default.  
The OpenAPI spec is available at **`http://localhost:5000/openapi.json`**.

---

## Environment Variables

Copy `.env.example` to `.env` and set the following:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `5000`) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Long random secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `NODE_ENV` | No | `development` or `production` |

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/notesapp?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

> **Security:** Never commit `.env` to version control. It is already listed in `.gitignore`.

---

## API Reference

All authenticated endpoints require:

```
Authorization: Bearer <your_jwt_token>
```

Error responses always follow:

```json
{ "success": false, "message": "..." }
```

---

### Auth

#### `POST /register`

Register a new user.

**Request body:**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Responses:**

| Status | Body |
|---|---|
| `201 Created` | `{ "success": true, "message": "User registered successfully." }` |
| `409 Conflict` | Email already registered |
| `422 Unprocessable` | Validation errors |

---

#### `POST /login`

Authenticate and receive a JWT.

**Request body:**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Responses:**

| Status | Body |
|---|---|
| `200 OK` | `{ "access_token": "<jwt>" }` |
| `401 Unauthorized` | `{ "message": "Invalid email or password" }` |
| `422 Unprocessable` | Validation errors |

---

### Notes

All notes endpoints require a valid `Authorization` header.

**Note response shape:**
```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "is_pinned": false,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

---

#### `GET /notes`

Get all notes **created by** the authenticated user (owner only).  
Supports pagination via query params.

**Query parameters (all optional):**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `10` | Notes per page (max 100) |

**Response:** `200 OK` — array of note objects (pinned notes sorted first).

---

#### `GET /notes/:id`

Get a specific note. Accessible by the **owner** or any user the note was **shared with**.

**Responses:**

| Status | Description |
|---|---|
| `200 OK` | Note object |
| `400 Bad Request` | Invalid ID format |
| `404 Not Found` | Note not found or no access |

---

#### `POST /notes`

Create a new note.

**Request body:**
```json
{ "title": "string", "content": "string" }
```

**Responses:**

| Status | Description |
|---|---|
| `201 Created` | New note object |
| `422 Unprocessable` | Validation errors |

---

#### `PUT /notes/:id`

Update an existing note. **Owner only.** Supports partial updates (send only the fields to change).

**Request body:**
```json
{ "title": "string", "content": "string" }
```

**Responses:**

| Status | Description |
|---|---|
| `200 OK` | Updated note object |
| `400 Bad Request` | Invalid ID format |
| `404 Not Found` | Note not found or not the owner |
| `422 Unprocessable` | Validation errors |

---

#### `DELETE /notes/:id`

Delete a note. **Owner only.**

**Responses:**

| Status | Description |
|---|---|
| `204 No Content` | Deleted successfully |
| `400 Bad Request` | Invalid ID format |
| `404 Not Found` | Note not found or not the owner |

---

#### `POST /notes/:id/share`

Share a note with another registered user. **Owner only.**  
After sharing, the target user can read the note via `GET /notes/:id`.

**Request body:**
```json
{ "share_with_email": "other@example.com" }
```

**Responses:**

| Status | Description |
|---|---|
| `200 OK` | `{ "message": "Note successfully shared with other@example.com." }` |
| `400 Bad Request` | Cannot share with yourself |
| `404 Not Found` | Note not found, or email not registered |
| `409 Conflict` | Already shared with this user |
| `422 Unprocessable` | Validation errors |

---

#### `PATCH /notes/:id/pin`

Toggle the pin status of a note. **Owner only.** (Custom feature — see below.)

**Responses:**

| Status | Body |
|---|---|
| `200 OK` | `{ "message": "Note pinned/unpinned successfully.", "note": { ... } }` |
| `404 Not Found` | Note not found or not the owner |

---

### Search

#### `GET /search?q=keyword`

Full-text search across the authenticated user's notes (title and content).  
Results are ranked by relevance.

**Query parameters:**

| Param | Required | Description |
|---|---|---|
| `q` | **Yes** | Search keyword or phrase |

**Response:** `200 OK`
```json
{ "success": true, "data": [ ...notes ], "total": 3 }
```

---

### Meta

#### `GET /about`

Returns API author info and custom feature descriptions.

#### `GET /openapi.json`

Returns the full OpenAPI 3.0 specification for all endpoints.

---

## Custom Feature — Pin Notes

`PATCH /notes/:id/pin`

Users can **pin** important notes so they always appear at the top of the `GET /notes` list.  
Calling the endpoint again **unpins** the note (toggle). Only the note owner can pin/unpin.

This was chosen because prioritising critical notes is the most common quality-of-life need in any notes app (similar to Google Keep's pin, Apple Notes' pin-to-top).

---

## Stretch Goals Implemented

| Goal | Endpoint |
|---|---|
| Pagination on `GET /notes` | `?page=1&limit=10` |
| Full-text search | `GET /search?q=keyword` |
| Dockerize | See [Docker](#docker) section |

---

## Docker

### Build and run locally

```bash
# Build the image
docker build -t notes-api .

# Run the container (pass your .env file)
docker run -p 5000:5000 --env-file .env notes-api
```

The server will be available at `http://localhost:5000`.

### Notes on the image

- Base image: `node:20-alpine` (minimal footprint)
- Runs as a **non-root user** (`appuser`) for security
- Only production dependencies are installed (`npm ci --omit=dev`)
- `NODE_ENV=production` is set inside the image

---

## Deploy to Render

1. **Push the project to GitHub.**

2. Go to [render.com](https://render.com) → **New Web Service** → connect your repository.

3. Set the following:

   | Setting | Value |
   |---|---|
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |

4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A long random secret |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |

5. In **MongoDB Atlas → Network Access**, allow Render's outbound IPs  
   or use `0.0.0.0/0` (allow all) for evaluation purposes.

6. Click **Deploy**. Your base URL will be something like:  
   `https://your-app-name.onrender.com`

7. Verify the deployment:
   ```
   curl https://your-app-name.onrender.com/about
   curl https://your-app-name.onrender.com/openapi.json
   ```

> **Note:** Render free tier spins down after 15 minutes of inactivity.  
> The first request after spin-down may take 30–60 seconds to respond.
