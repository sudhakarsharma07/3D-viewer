import { useState } from "react";
import api from "../api/api";

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setError("");
    const formData = new FormData();
    formData.append("model", file);

    try {
      const res = await api.post("/objects", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="upload-box">
      <div>Upload a 3D model (.obj, .glb, .gltf)</div>
      <input
        type="file"
        accept=".obj,.glb,.gltf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      {error && <div className="error-text">{error}</div>}
      <button className="primary-btn" onClick={handleUpload} disabled={!file || busy}>
        {busy ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}