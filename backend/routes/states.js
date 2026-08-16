const express = require("express");
const InteractionState = require("../models/InteractionState");
const Object3D = require("../models/Object3D");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// POST /api/states  { objectId, label, cameraPosition:{x,y,z}, cameraTarget:{x,y,z}, zoom }
router.post("/", requireAuth, async (req, res) => {
  try {
    const { objectId, label, cameraPosition, cameraTarget, zoom } = req.body;

    if (!objectId || !cameraPosition || !cameraTarget) {
      return res.status(400).json({ message: "objectId, cameraPosition and cameraTarget are required" });
    }

    const object = await Object3D.findOne({ _id: objectId, owner: req.userId });
    if (!object) {
      return res.status(404).json({ message: "Object not found or not owned by you" });
    }

    const state = await InteractionState.findOneAndUpdate(
      { owner: req.userId, object: objectId, label: label || "Default view" },
      { cameraPosition, cameraTarget, zoom: zoom ?? 1 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(state);
  } catch (err) {
    console.error("Save state error:", err.message);
    res.status(500).json({ message: "Server error saving interaction state" });
  }
});

// GET /api/states/:objectId  -> all saved states for one object, owned by the caller
router.get("/:objectId", requireAuth, async (req, res) => {
  const states = await InteractionState.find({
    owner: req.userId,
    object: req.params.objectId,
  }).sort({ updatedAt: -1 });
  res.json(states);
});

// DELETE /api/states/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const state = await InteractionState.findOne({ _id: req.params.id, owner: req.userId });
  if (!state) return res.status(404).json({ message: "State not found" });
  await state.deleteOne();
  res.json({ message: "Deleted" });
});

module.exports = router;
