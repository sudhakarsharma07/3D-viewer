import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import ThreeViewer from "../components/ThreeViewer";
import UploadForm from "../components/UploadForm";

export default function Viewer() {
  const [objects, setObjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [states, setStates] = useState([]);
  const [activeInitialState, setActiveInitialState] = useState(null);
  const [label, setLabel] = useState("");
  const controlsApiRef = useRef(null);

  useEffect(() => {
    loadObjects();
  }, []);

  useEffect(() => {
    if (selected) {
      loadStates(selected._id);
      setActiveInitialState(null); // default view unless a saved state is loaded
    }
  }, [selected]);

  async function loadObjects() {
    const res = await api.get("/objects");
    setObjects(res.data);
    if (res.data.length && !selected) setSelected(res.data[0]);
  }

  async function loadStates(objectId) {
    const res = await api.get(`/states/${objectId}`);
    setStates(res.data);
  }

  function handleUploaded(newObject) {
    setObjects((prev) => [newObject, ...prev]);
    setSelected(newObject);
  }

  async function saveCurrentView() {
    if (!selected || !controlsApiRef.current) return;
    const { cameraPosition, cameraTarget, zoom } = controlsApiRef.current.getCameraState();
    await api.post("/states", {
      objectId: selected._id,
      label: label || "Default view",
      cameraPosition,
      cameraTarget,
      zoom,
    });
    setLabel("");
    loadStates(selected._id);
  }

  function loadSavedView(state) {
    setActiveInitialState({
      cameraPosition: state.cameraPosition,
      cameraTarget: state.cameraTarget,
      zoom: state.zoom,
    });
  }

  async function deleteState(id) {
    await api.delete(`/states/${id}`);
    loadStates(selected._id);
  }

  return (
    <div className="viewer-layout">
      <div className="sidebar">
        <UploadForm onUploaded={handleUploaded} />

        <h3>Your objects</h3>
        {objects.length === 0 && <p className="hint">No objects uploaded yet.</p>}
        {objects.map((obj) => (
          <div
            key={obj._id}
            className={`object-item ${selected?._id === obj._id ? "active" : ""}`}
            onClick={() => setSelected(obj)}
          >
            {obj.originalName}
          </div>
        ))}

        {selected && (
          <>
            <h3 style={{ marginTop: 24 }}>Saved views</h3>
            <input
              type="text"
              placeholder="View label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={{
                width: "100%",
                marginBottom: 8,
                padding: 6,
                borderRadius: 4,
                border: "1px solid #2e323d",
                background: "#0f1115",
                color: "#e8e8ea",
              }}
            />
            <button className="primary-btn" onClick={saveCurrentView}>
              Save current view
            </button>

            <div style={{ marginTop: 12 }}>
              {states.map((s) => (
                <div key={s._id} className="state-row">
                  <span>{s.label}</span>
                  <div>
                    <button onClick={() => loadSavedView(s)}>Load</button>{" "}
                    <button onClick={() => deleteState(s._id)}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="canvas-wrap">
        {selected ? (
          <ThreeViewer
            key={selected._id + (activeInitialState ? JSON.stringify(activeInitialState) : "")}
            fileUrl={selected.fileUrl}
            format={selected.format}
            initialState={activeInitialState}
            onControlsRef={(api) => (controlsApiRef.current = api)}
          />
        ) : (
          <div style={{ padding: 24 }}>Upload a 3D object to get started.</div>
        )}
      </div>
    </div>
  );
}
