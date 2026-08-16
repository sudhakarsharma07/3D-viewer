const mongoose = require("mongoose");

const object3DSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true }, // name on disk / S3 key
    fileUrl: { type: String, required: true }, // public/served URL
    format: { type: String, enum: ["obj", "glb", "gltf"], required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Object3D", object3DSchema);
