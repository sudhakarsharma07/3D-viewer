# 3D Object Viewer — MERN + Three.js

Full-stack web application to upload, visualize, and manipulate 3D objects
(`.obj` / `.glb` / `.gltf`) with JWT authentication and persistent camera
states. Built as part of a technical assignment (MERN + Three.js + AWS).

**Live demo:** https://3-d-viewer-kohl.vercel.app
**Backend API:** https://threed-viewer-od2i.onrender.com

---

## Features

- User registration, login, and logout (JWT-based auth, bcrypt-hashed passwords)
- Upload `.obj`, `.glb`, `.gltf` 3D models (50MB cap, extension-validated)
- Rotate, zoom, and pan 3D models in-browser via Three.js `OrbitControls`
- Auto-frames each model on load based on its bounding box
- Save named camera views (position, look-at target, zoom) per object, per user
- Load a saved view instantly; delete individual saved views
- Delete an uploaded object — cascades to remove its file and all saved views
- Fully responsive UI (collapsible side panel on mobile) with a blueprint/CAD-inspired theme
- Protected routes: all object/state operations require a valid JWT
- Rate limiting, Helmet security headers, and CORS locked to a single origin

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18, Vite, Three.js, React Router, Axios |
| Backend    | Node.js, Express, Mongoose, JWT, bcrypt, Multer, Helmet, express-rate-limit |
| Database   | MongoDB (Atlas) |
| Hosting    | Render (backend API) + Vercel (frontend) — AWS-equivalent architecture, see Deployment section |

---

## Project Structure

```
project/
├── backend/
│   ├── models/          User, Object3D, InteractionState (Mongoose schemas)
│   ├── routes/           auth.js, objects.js, states.js
│   ├── middleware/       auth.js (JWT verification)
│   ├── uploads/          uploaded model files (local disk, gitignored)
│   ├── server.js         Express app entrypoint
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           axios client with JWT interceptor
│   │   ├── context/       AuthContext (global auth state)
│   │   ├── components/    ThreeViewer, UploadForm
│   │   ├── pages/         Login, Register, Viewer
│   │   └── App.jsx, main.jsx, App.css
│   ├── vercel.json       SPA rewrite rule (fixes 404 on refresh)
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Run Locally

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local mongod, or a free MongoDB Atlas cluster)

### 1. Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URI and a real JWT_SECRET
npm install
npm run dev                # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env       # set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

---

## Environment Variables

**backend/.env**
```dotenv
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

**frontend/.env**
```dotenv
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files — both are gitignored. Only `.env.example` (with
placeholder values) is tracked.

---

## API Reference

| Method | Endpoint              | Auth | Description                          |
|--------|------------------------|------|---------------------------------------|
| POST   | /api/auth/register   | No   | Create account, returns JWT           |
| POST   | /api/auth/login      | No   | Authenticate, returns JWT             |
| POST   | /api/auth/logout     | Yes  | Stateless logout                      |
| GET    | /api/auth/me         | Yes  | Get current user                      |
| POST   | /api/objects         | Yes  | Upload a 3D model (multipart/form-data) |
| GET    | /api/objects         | Yes  | List current user's objects           |
| DELETE | /api/objects/:id     | Yes  | Delete an object (cascades to files + saved states) |
| POST   | /api/states          | Yes  | Save/update a named camera view       |
| GET    | /api/states/:objectId| Yes  | List saved views for an object        |
| DELETE | /api/states/:id      | Yes  | Delete a saved view                   |
| GET    | /api/health          | No   | Health check                          |

---

## Deployment

The application was architected for AWS (EC2/Elastic Beanstalk behind an
Application Load Balancer with an Auto Scaling Group, S3 + CloudFront for
static assets and file storage, MongoDB Atlas for the database). It is
currently deployed on equivalent managed platforms — Render (backend)
and Vercel (frontend) — due to AWS account access constraints (card
verification). The request flow, security model, and scaling approach are
unchanged; only the hosting provider differs. Full architecture details are
in the accompanying technical documentation.

### Redeploying
Both Render and Vercel are connected to this repository with auto-deploy
enabled — pushing to main triggers a redeploy on both platforms
automatically.

**Known limitation:** Render's free tier uses ephemeral disk storage —
uploaded files do not survive a redeploy or free-tier restart. For a
persistent production setup, swap multer.diskStorage in
backend/routes/objects.js for multer-s3 (or Cloudinary) to store files
in object storage instead of local disk.

---

## Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT bearer tokens (7-day expiry), verified on every protected route
- Per-resource ownership checks (users can only access their own objects/states)
- Helmet security headers, CORS restricted to a single allowed origin
- Rate limiting on all /api routes
- File upload validation (extension allowlist, 50MB size cap)

---

## Author

Sudhakar Sharma
