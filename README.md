# Image Processing Service

A production-ready **Node.js + TypeScript backend** for user authentication and image processing. The project supports secure user accounts, image uploads via Cloudinary, image transformations, pagination, and background processing with a clean layered architecture.

---

##  Features

- **JWT Authentication** (Register / Login / Profile)
- **Image Uploads** using Multer + Cloudinary
- **Image Transformations** (resize, crop, rotate, format, filters)
- **Paginated Image Listing** per user
- **Background Worker** (BullMQ + Redis)
- **Prisma ORM** with SQLite
- **Centralized Error Handling**
  **Scalable Architecture** (Controller / Service / Model)

---

## Project Structure

```
backend
├── package.json
├── tsconfig.json
├── jest.config.ts
├── prisma
│   ├── schema.prisma
│   └── migrations
├── src
│   ├── app.ts
│   ├── server.ts
│   ├── worker.ts
│   ├── cache
│   │   └── redis.ts
│   ├── config
│   │   └── cloudinary.ts
│   ├── middlewares
│   │   ├── auth.ts
│   │   ├── requestLogger.ts
│   │   └── validate.ts
│   ├── modules
│   │   ├── users
│   │   │   ├── user.controller.ts
│   │   │   ├── user.controller.spec.ts
│   │   │   ├── user.model.ts
│   │   │   ├── user.route.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.validation.ts
│   │   └── images
│   │       ├── image.controller.ts
│   │       ├── image.controller.spec.ts
│   │       ├── image.model.ts
│   │       ├── image.route.ts
│   │       ├── image.service.ts
│   │       └── image.validation.ts
│   ├── queue
│   │   └── bullmq.ts
│   ├── storage
│   │   └── multer.ts
│   ├── types
│   │   ├── customError.ts
│   │   └── HTTPStatusText.ts
│   └── utils
│       ├── errorHandler.ts
│       ├── hash.ts
│       ├── jwt.ts
│       ├── logger.ts
│       ├── rateLimiter.ts
│       └── verifyToken.ts
```

- `backend/src/app.ts` sets up routes and middleware
- `backend/src/server.ts` starts the HTTP server
- `backend/src/worker.ts` runs background queue jobs

---

## Tech Stack

- **Node.js**
- **TypeScript**
- **Express**
- **Prisma ORM**
- **SQLite**
- **Cloudinary**
- **Multer**
- **JWT**
- **BullMQ**
- **Redis**

---

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```

---

## Installation

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Apply database schema:

```bash
npx prisma migrate dev --name init
```

---

## Running the Project

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Backend Production

```bash
cd backend
npm run build
npm start
```

### Backend Worker (Background Jobs)

```bash
cd backend
npm run start_worker
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

---

## Frontend (Next.js) setup

The repository now includes a minimal GitHub-themed dark frontend in `frontend/` that uses all backend routes.

```bash
cd frontend
npm install
npm run dev
```

- Frontend URL: http://localhost:3000
- API base URL: http://localhost:5000 (adjust with `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`)

### Frontend features

- Register / Login / Profile (`/users/*`)
- Image upload (`POST /images`)
- Upload status (`GET /images/:id/status`)
- Get image by public ID (`GET /images/:publicId`)
- Paginated images (`GET /images?page=&limit=`)
- Transform image (`POST /images/transform`)

---

## Authentication Endpoints

| Method | Endpoint | Description |
|------|--------|------------|
| POST | `/users/register` | Register user |
| POST | `/users/login` | Login |
| GET | `/users/profile` | Get profile (JWT required) |

---

## Image Endpoints

| Method | Endpoint | Description |
|------|--------|------------|
| POST | `/images` | Upload image (JWT + multipart) |
| POST | `/images/transform` | Transform image |
| GET | `/images?page=1&limit=10` | Paginated images (JWT) |
| GET | `/images/:publicId` | Get image by ID |

---

## 🧠 Architecture Principles

- **Controllers**: HTTP layer only
- **Services**: Business logic
- **Models**: Database access (Prisma)
- **Utils**: Shared helpers
- **Middlewares**: Auth & validation


## Error Handling

All errors go through a centralized error handler:

```json
{
  "status": "error",
  "message": "Error description"
}
```

Solution for Image Processing Service Project https://roadmap.sh/projects/image-processing-service
