import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Renders a Three.js scene for a single object.
 * Props:
 *  - fileUrl: URL of the .obj / .glb / .gltf file to load
 *  - format: "obj" | "glb" | "gltf"
 *  - initialState: optional { cameraPosition, cameraTarget, zoom } to restore on load
 *  - onControlsRef: callback receiving { getCameraState() } once ready, so the
 *    parent can trigger a "save current view" action.
 */
export default function ThreeViewer({ fileUrl, format, initialState, onControlsRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1115);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(3, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true; // pan
    // zoom (dolly) and rotate are enabled by default in OrbitControls

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    scene.add(new THREE.GridHelper(10, 10, 0x2e323d, 0x2e323d));

    let loadedObject = null;

    function frameObject(object) {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());

      object.position.sub(center); // center the model at origin

      if (!initialState) {
        const dist = size * 1.2 || 5;
        camera.position.set(dist, dist * 0.6, dist);
        controls.target.set(0, 0, 0);
      }
      camera.near = size / 100 || 0.1;
      camera.far = size * 100 || 1000;
      camera.updateProjectionMatrix();
    }

    function applyInitialState() {
      if (!initialState) return;
      const { cameraPosition, cameraTarget, zoom } = initialState;
      if (cameraPosition) camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      if (cameraTarget) controls.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      if (zoom) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
    }

    if (fileUrl) {
      if (format === "obj") {
        new OBJLoader().load(
          fileUrl,
          (object) => {
            loadedObject = object;
            scene.add(object);
            frameObject(object);
            applyInitialState();
          },
          undefined,
          (err) => console.error("OBJ load error:", err)
        );
      } else {
        // glb / gltf
        new GLTFLoader().load(
          fileUrl,
          (gltf) => {
            loadedObject = gltf.scene;
            scene.add(gltf.scene);
            frameObject(gltf.scene);
            applyInitialState();
          },
          undefined,
          (err) => console.error("GLTF load error:", err)
        );
      }
    }

    let frameId;
    function animate() {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    // expose a way for the parent to read current camera state (for "save view")
    if (onControlsRef) {
      onControlsRef({
        getCameraState: () => ({
          cameraPosition: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          },
          cameraTarget: {
            x: controls.target.x,
            y: controls.target.y,
            z: controls.target.z,
          },
          zoom: camera.zoom,
        }),
      });
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (loadedObject) scene.remove(loadedObject);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
    // re-create the scene whenever the file or the state we're restoring changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, format]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
