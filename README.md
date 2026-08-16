# 3D Object Viewer — MERN + Three.js

Full-stack app: upload `.obj`/`.glb` files, view & manipulate them in 3D
(rotate/zoom/pan via OrbitControls), save camera views per object, JWT auth.

## Structure
```
project/
  backend/    Node + Express + MongoDB (Mongoose), JWT auth, multer upload
  frontend/   React (Vite) + Three.js
```

## Run locally

### 1. Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URI and a real JWT_SECRET
npm install
npm run dev                # nodemon, http://localhost:5000
```
Requires a running MongoDB instance (local `mongod` or MongoDB Atlas connection string).

### 2. Frontend
```bash
cd frontend
cp .env.example .env       # point VITE_API_URL at your backend
npm install
npm run dev                 # http://localhost:5173
```

## What's implemented
- Register / login / logout with JWT (`bcryptjs` hashed passwords, 7-day token)
- Protected routes: object upload, listing, and view-state save/load all require `Authorization: Bearer <token>`
- Upload `.obj` / `.glb` / `.gltf` (50MB cap, extension-filtered) via `multer`
- Three.js viewer: OrbitControls for rotate/zoom/pan, auto-frames the model on load
- "Save current view" persists camera position, look-at target, and zoom to MongoDB, scoped per user + object; multiple named views per object
- Basic hardening: `helmet`, CORS locked to `CLIENT_ORIGIN`, `express-rate-limit` on `/api`

## Next steps for the actual submission (AWS + polish)

These are intentionally left for you to do hands-on, since the assignment
evaluates you deploying and documenting it yourself:

1. **MongoDB**: use MongoDB Atlas (free M0 tier is fine) instead of self-hosting
   on EC2 — simpler, and still "MongoDB on AWS infra" since Atlas runs on AWS.
2. **File storage**: swap `multer.diskStorage` in `backend/routes/objects.js`
   for `multer-s3` so uploaded models go to an S3 bucket, not the EC2 disk.
   Serve them via CloudFront in front of the bucket.
3. **Backend hosting**: EC2 (or Elastic Beanstalk to get auto-scaling + load
   balancing configured for you with less manual setup). Put an Application
   Load Balancer in front, attach an Auto Scaling Group (min 1–2 instances).
4. **HTTPS**: ACM certificate on the ALB or CloudFront, redirect HTTP→HTTPS.
5. **Frontend hosting**: `npm run build` in `frontend/`, upload `dist/` to
   an S3 bucket configured for static hosting, front it with CloudFront.
6. **Env/secrets**: don't commit `.env`; use EC2 instance environment vars,
   Elastic Beanstalk env config, or AWS Secrets Manager for `JWT_SECRET` /
   `MONGO_URI`.
7. **Docs deliverable**: draw the request flow (Browser → CloudFront/S3
   frontend → ALB → EC2/Beanstalk backend → MongoDB Atlas, with S3 for model
   files) and write up the auth flow, rate limiting, and helmet headers as
   your security section.
