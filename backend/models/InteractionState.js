const mongoose = require("mongoose");

const vector3Schema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  { _id: false }
);

const interactionStateSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    object: { type: mongoose.Schema.Types.ObjectId, ref: "Object3D", required: true, index: true },
    label: { type: String, default: "Default view" },
    cameraPosition: { type: vector3Schema, required: true },
    cameraTarget: { type: vector3Schema, required: true },
    zoom: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// one user can save multiple named states per object, but (owner, object, label) should be unique
interactionStateSchema.index({ owner: 1, object: 1, label: 1 }, { unique: true });

module.exports = mongoose.model("InteractionState", interactionStateSchema);
