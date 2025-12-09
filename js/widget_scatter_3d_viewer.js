// from https://github.com/koaning/mothree/blob/main/src/mothree/static/widget.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * @param {{ model: { get: (arg0: string) => any; on: (arg0: string, arg1: () => void) => void; }; el: any; }} context
 */
function render_scatter_3d_viewer({ model, el }) {
    // Create container
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = model.get("width") + "px";
    container.style.height = model.get("height") + "px";
    el.appendChild(container);

    // Get display options
    const darkMode = model.get("dark_mode");
    const showGrid = model.get("show_grid");
    const showAxes = model.get("show_axes");

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(darkMode ? 0x1a1a1a : 0xffffff);

    // Camera setup
    const width = model.get("width");
    const height = model.get("height");
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, darkMode ? 0.4 : 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, darkMode ? 0.6 : 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Grid helper
    let gridHelper = null;
    if (showGrid) {
        gridHelper = new THREE.GridHelper(10, 10, darkMode ? 0x666666 : 0x888888, darkMode ? 0x333333 : 0xcccccc);
        scene.add(gridHelper);
    }

    // Axes helper
    let axesHelper = null;
    if (showAxes) {
        axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
    }

    // Store chart objects for updates
    let chartObjects = [];

    function clearChart() {
        chartObjects.forEach((obj) => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        chartObjects = [];
    }

    function updateChart() {
    clearChart();

    const data = model.get("data");
    const positions = [];
    const colors = [];
    const sizes = [];

    data.forEach((point) => {
        positions.push(point.x || 0, point.y || 0, point.z || 0);

        const color = new THREE.Color(point.color || "#00ff00");
        colors.push(color.r, color.g, color.b);

        // Use per-point size if available, otherwise default to 0.1
        sizes.push(point.size !== undefined ? point.size : 0.1);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        vertexColors: true,
        sizeAttenuation: true
    });

    // Custom shader to support per-vertex sizes
    material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
            'uniform float size;',
            'attribute float size;'
        );
    };

    const points = new THREE.Points(geometry, material);
        scene.add(points);
        chartObjects.push(points);
    }

    // Initial chart render
    updateChart();

    // Listen for data changes
    model.on("change:data", updateChart);

    // Animation loop
    let animationId;
    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Cleanup on widget removal
    return () => {
        cancelAnimationFrame(animationId);
        clearChart();
        renderer.dispose();
        controls.dispose();
    };
}

export { render_scatter_3d_viewer };
