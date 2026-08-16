const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");
const Object3D = require("../models/Object3D");
const InteractionState = require("../models/InteractionState");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const ALLOWED_EXT = [".obj", ".glb", ".gltf"];

// NOTE: for production on AWS, swap this diskStorage for multer-s3 and
// stream uploads directly into an S3 bucket instead of local disk.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB cap
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return cb(new Error("Only .obj, .glb, .gltf files are allowed"));
    }
    cb(null, true);
  },
});

// POST /api/objects  (authenticated, multipart/form-data, field name "model")
router.post("/", requireAuth, upload.single("model"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const object = await Object3D.create({
      owner: req.userId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileUrl,
      format: ext,
      sizeBytes: req.file.size,
    });

    res.status(201).json(object);
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ message: "Server error during upload" });
  }
});

// GET /api/objects  (authenticated, list current user's uploaded objects)
router.get("/", requireAuth, async (req, res) => {
  const objects = await Object3D.find({ owner: req.userId }).sort({ createdAt: -1 });
  res.json(objects);
});

// DELETE /api/objects/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const object = await Object3D.findOne({ _id: req.params.id, owner: req.userId });
    if (!object) return res.status(404).json({ message: "Object not found" });

    // remove the file from disk (best-effort — don't fail the request if it's already gone)
    const filePath = path.join(__dirname, "..", "uploads", object.fileName);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") console.error("File delete error:", err.message);
    });

    // remove any saved camera views tied to this object so they don't become orphaned
    await InteractionState.deleteMany({ object: object._id, owner: req.userId });

    await object.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete object error:", err.message);
    res.status(500).json({ message: "Server error during delete" });
  }
});

module.exports = router;