# Wanderlast Server

A RESTful backend API for a travel/tourism booking platform built with Express.js and MongoDB. It handles travel destination management and user booking operations with JWT-based authentication and role-based access control.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Database:** MongoDB (native driver v7)
- **Authentication:** JWT with JWKS validation (jose-cjs)
- **Deployment:** Vercel (serverless)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB Atlas account or local MongoDB instance
- A client application that exposes a JWKS endpoint (e.g., Clerk, NextAuth)

### Installation

```bash
git clone <repository-url>
cd wanderlast-server
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
CLIENT_URL=http://localhost:3000
```

| Variable       | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| `PORT`         | Port number the server runs on                                  |
| `MONGO_DB_URI` | MongoDB connection string                                       |
| `CLIENT_URL`   | Frontend client URL (used to fetch JWKS for token verification) |

### Running the Server

**Development (with hot-reload):**

```bash
npm run server
```

**Production:**

```bash
node index.js
```

## Database Structure

**Database name:** `wanderlast`

### Collections

| Collection     | Description                           |
| -------------- | ------------------------------------- |
| `destinations` | Travel destinations managed by admins |
| `bookings`     | User booking records                  |

## Authentication & Authorization

### How It Works

The server validates JWTs using JWKS (JSON Web Key Set) fetched from the client application at `CLIENT_URL/api/auth/jwks`. Tokens must be sent in the `Authorization` header as a Bearer token.

```
Authorization: Bearer <token>
```

### Roles

| Role                     | Permissions                                             |
| ------------------------ | ------------------------------------------------------- |
| **User** (authenticated) | Create bookings, view own bookings, delete own bookings |
| **Admin**                | All user permissions + full CRUD on destinations        |

### Middleware

- **`verifyJWT`** — Validates the JWT and attaches the decoded payload to `req.user`. Used for authenticated user routes.
- **`verifyAdminJWT`** — Validates the JWT and checks that `payload.role === "admin"`. Returns 403 if the user is not an admin.

## API Endpoints

### Health Check

| Method | Endpoint | Auth | Description           |
| ------ | -------- | ---- | --------------------- |
| GET    | `/`      | None | Returns server status |

**Response:**

```
Server is cooking!
```

---

### Destinations

#### Get All Destinations

```
GET /destinations
```

**Auth:** None (public)

**Response:**

```json
[
  {
    "_id": "664f1a2b...",
    "name": "Bali, Indonesia",
    "description": "Tropical paradise...",
    "image": "https://...",
    "price": 1200
  }
]
```

---

#### Get Destination by ID

```
GET /destinations/:id
```

**Auth:** None (public)

**Parameters:**

| Param | Type   | Description                         |
| ----- | ------ | ----------------------------------- |
| `id`  | string | MongoDB ObjectId of the destination |

**Response:**

```json
{
  "_id": "664f1a2b...",
  "name": "Bali, Indonesia",
  "description": "Tropical paradise...",
  "image": "https://...",
  "price": 1200
}
```

---

#### Create Destination

```
POST /destinations
```

**Auth:** Admin JWT required

**Request Body:**

```json
{
  "name": "Bali, Indonesia",
  "description": "Tropical paradise with stunning beaches",
  "image": "https://example.com/bali.jpg",
  "price": 1200
}
```

**Response:**

```json
{
  "success": true,
  "message": "Destination added successfully",
  "id": "664f1a2b..."
}
```

---

#### Update Destination

```
PATCH /destinations/:id
```

**Auth:** Admin JWT required

**Parameters:**

| Param | Type   | Description                         |
| ----- | ------ | ----------------------------------- |
| `id`  | string | MongoDB ObjectId of the destination |

**Request Body:** (partial update — only include fields to change)

```json
{
  "price": 1500
}
```

**Response:**

```json
{
  "success": true,
  "message": "Destination updated successfully",
  "modifiedCount": 1
}
```

---

#### Delete Destination

```
DELETE /destinations/:id
```

**Auth:** Admin JWT required

**Parameters:**

| Param | Type   | Description                         |
| ----- | ------ | ----------------------------------- |
| `id`  | string | MongoDB ObjectId of the destination |

**Response:**

```json
{
  "success": true,
  "message": "Destination deleted successfully",
  "deletedCount": 1
}
```

---

### Bookings

#### Create Booking

```
POST /bookings
```

**Auth:** JWT required (any authenticated user)

**Request Body:**

```json
{
  "userId": "user_abc123",
  "destinationId": "664f1a2b...",
  "destinationName": "Bali, Indonesia",
  "date": "2026-07-15",
  "guests": 2
}
```

**Response:**

```json
{
  "success": true,
  "message": "Booking added successfully",
  "id": "664f2c3d..."
}
```

---

#### Get User's Bookings

```
GET /bookings/:userId
```

**Auth:** JWT required (owner only — `userId` must match the token's `sub` claim)

**Parameters:**

| Param    | Type   | Description                 |
| -------- | ------ | --------------------------- |
| `userId` | string | The authenticated user's ID |

**Response:**

```json
[
  {
    "_id": "664f2c3d...",
    "userId": "user_abc123",
    "destinationId": "664f1a2b...",
    "destinationName": "Bali, Indonesia",
    "date": "2026-07-15",
    "guests": 2
  }
]
```

**Error (403):** Returned if the authenticated user tries to access another user's bookings.

---

#### Delete Booking

```
DELETE /bookings/:id
```

**Auth:** JWT required (owner only — booking must belong to the authenticated user)

**Parameters:**

| Param | Type   | Description                     |
| ----- | ------ | ------------------------------- |
| `id`  | string | MongoDB ObjectId of the booking |

**Response:**

```json
{
  "success": true,
  "message": "Booking deleted successfully",
  "deletedCount": 1
}
```

**Error (404):** Booking not found.
**Error (403):** User attempting to delete another user's booking.

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status Code | Meaning                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| 401         | Unauthorized — missing or invalid token                                   |
| 403         | Forbidden — insufficient permissions or accessing another user's resource |
| 404         | Not Found — resource does not exist                                       |

## Deployment

The server is configured for deployment on **Vercel** as a serverless function.

### Vercel Configuration

The `vercel.json` routes all requests to `index.js` and sets CORS headers at the platform level:

- All HTTP methods supported (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- `Access-Control-Allow-Origin: *`
- Authorization header allowed

### Deploy

```bash
vercel --prod
```

## Project Structure

```
wanderlast-server/
├── index.js          # Main server file (routes, middleware, DB connection)
├── package.json      # Dependencies and scripts
├── vercel.json       # Vercel deployment configuration
├── .env              # Environment variables (not committed)
└── .gitignore        # Ignored files (node_modules, .env)
```

## Dependencies

| Package  | Version | Purpose                         |
| -------- | ------- | ------------------------------- |
| express  | ^5.2.1  | Web framework                   |
| mongodb  | ^7.2.0  | MongoDB native driver           |
| jose-cjs | ^6.2.3  | JWT/JWKS verification           |
| cors     | ^2.8.6  | Cross-Origin Resource Sharing   |
| dotenv   | ^17.4.2 | Environment variable management |
