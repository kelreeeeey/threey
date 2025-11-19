import "./widget.css";

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { evaluate_cmap } from "./js-colormaps"

async function render({ model, el }) {
    const kind = model.get("kind");

    // const colormapsModule = await import("./js-colormaps.js");
    // const evaluate_cmap = colormapsModule.evaluate_cmap;

    // Create main container with flex layout
    const container_main = document.createElement("div");
    container_main.style.display = "flex";
    container_main.style.flexDirection = "column";
    container_main.style.alignItems = "center";
    container_main.style.gap = "10px";

    // Create toolbar
    const toolbar = document.createElement("div");
    toolbar.style.display = "flex";
    toolbar.style.width = model.get("width") + "px";
    toolbar.style.gap = "8px";
    toolbar.style.padding = "8px";
    toolbar.style.background = model.get("dark_mode") ? "#2d3748" : "#f7fafc";
    toolbar.style.borderRadius = "6px";
    toolbar.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    // Create toolbar buttons
    const createToolbarButton = (text, onClick, isActive = false) => {
        const button = document.createElement("button");
        button.textContent = text;
        button.style.padding = "6px 12px";
        button.style.border = "1px solid #cbd5e0";
        button.style.borderRadius = "4px";
        button.style.background = isActive ? 
            (model.get("dark_mode") ? "#4a5568" : "#e2e8f0") : 
            (model.get("dark_mode") ? "#4a5568" : "white");
        button.style.color = model.get("dark_mode") ? "white" : "black";
        button.style.cursor = "pointer";
        button.style.fontSize = "14px";
        button.style.transition = "all 0.2s";

        button.addEventListener("mouseenter", () => {
            button.style.background = model.get("dark_mode") ? "#718096" : "#edf2f7";
        });
        button.addEventListener("mouseleave", () => {
            button.style.background = isActive ? 
                (model.get("dark_mode") ? "#4a5568" : "#e2e8f0") : 
                (model.get("dark_mode") ? "#4a5568" : "white");
        });

        button.addEventListener("click", onClick);
        return button;
    };

    // Create canvas container
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = model.get("width") + "px";
    container.style.height = model.get("height") + "px";
    container.style.border = "color; black";
    container.style.borderRadius = "6px";
    container.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    let dim = null;
    if ( "plane" === kind ) {
        dim = model.get("dimensions");
    }

    let cmap = null;
    cmap = model.get("cmap");


    // Build the DOM structure
    container_main.appendChild(toolbar);
    container_main.appendChild(container);
    el.appendChild(container_main);

    // Get display options
    const darkMode = model.get("dark_mode");
    const showGrid = model.get("show_grid");
    const showAxes = model.get("show_axes");
    const showFrameBox = model.get("show_frame");

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(darkMode ? 0x1a1a1a : 0xffffff);

    function updateBackground() {
        scene.background = null;
        scene.background = new THREE.Color(model.get("dark_mode") ? 0x1a1a1a : 0xffffff);
    }

    // Camera setup
    const width  = model.get("width");
    const height = model.get("height");
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    if (dim) {
        camera.position.set(dim.width+10, dim.height+10, dim.depth+10);
    } else {
        camera.position.set(5, 5, 5);
    }

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

    let frameBoxHelper = null;
    if  (showFrameBox) {
        frameBoxHelper = createFrameBox();
        scene.add(frameBoxHelper);
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

    function updateChartPoints() {

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

    // Convert grayscale to RGB
    function grayscaleToRGB(grayscaleArray, length, alpha, plane_cmap) {
        const rgbArray = new Uint8Array(length * 4);

        // const max_gr = grayscaleArray.sort((grayscaleArray,b)=>b.y-grayscaleArray.y)[0].y
        // const min_gr = grayscaleArray.sort((grayscaleArray,b)=>grayscaleArray.y-b.y)[0].y
        // // const min_gr = Math.min(grayscaleArray);
        let value = null;
        if (plane_cmap) {
            let i = 0;
            while (i < length) {
                value = evaluate_cmap(grayscaleArray[i], plane_cmap, false);
                if (i === 1) {
                }
                const idx = i*4
                rgbArray[idx    ] = value[0]; // R
                rgbArray[idx + 1] = value[1]; // G
                rgbArray[idx + 2] = value[2]; // B
                rgbArray[idx + 3] = alpha;
                i += 1;
            }
        } else if (cmap) {

        } else {
            let i = 0;
            while (i < length) {
                const value = Math.floor(grayscaleArray[i] * 255); // Normalize to 0-255
                const idx = i*4
                rgbArray[idx    ] = value; // R
                rgbArray[idx + 1] = value; // G
                rgbArray[idx + 2] = value; // B
                rgbArray[idx + 3] = alpha;
                i += 1;
            }

        }

        return rgbArray;
    }

    function updateChartPlane() {

        const data = model.get("data");
        const dim  = model.get("dimensions");

        data.forEach((plane) => {
            const texture = plane.texture;
            const plane_span = plane.span_through;
            const idx_plane  = plane.index;
            const alpha = plane.alpha * 255 || 255;
            const plane_cmap = plane.cmap || null;

            // let pos = plane.pos.x || 0, plane.pos.y || 0, plane.pos.z || 0;

            const geom = new THREE.PlaneGeometry(plane.width, plane.height);

            const startx = -(dim.width  / 2);
            const starty = -(dim.depth / 2);
            const startz = -(dim.height  / 2);

            const rgbData = grayscaleToRGB(plane.texture, plane.width * plane.height, alpha, plane_cmap);
            const dataTexture = new THREE.DataTexture(
                rgbData,
                plane.width,
                plane.height,
                THREE.RGBAFormat,
            );
            dataTexture.needsUpdate = true;
            dataTexture.generateMipmaps = true;
            dataTexture.magFilter = THREE.LinearFilter;
            dataTexture.minFilter = THREE.LinearFilter;
            const mesh =new THREE.MeshBasicMaterial(
                {
                    map:dataTexture,
                    side:THREE.DoubleSide,
                    transparent:true,
                    // color: 0x000000
                }
            );

            if ("crossline" == plane_span) {
                geom.translate(0, 0, startz + idx_plane);
            }

            if ("inline" == plane_span) {
                geom.translate(0, 0, startx + idx_plane)
            }


            const planeMesh = new THREE.Mesh(geom, mesh);

            if ( "crossline" === plane_span ) {
                planeMesh.rotation.y=-Math.PI/2;
            }

            if ( "inline" === plane_span ) {
                planeMesh.rotation.y=0;
            }

            planeMesh.position.set(0, 0, 0);

            scene.add(planeMesh);
            chartObjects.push(planeMesh);

        });
    }

    function updateChart() {
        clearChart();

        if (kind === "scatter-point") {
            updateChartPoints();
        }

        if (kind === "plane") {
            updateChartPlane();
        }

    }

    // Toolbar functionality
    let gridVisible = showGrid;
    let axesVisible = showAxes;
    let frameBoxVisible = showFrameBox;

    // Grid toggle button
    const gridButton = createToolbarButton("Grid", () => {
        gridVisible = !gridVisible;
        if (gridVisible) {
            gridHelper = new THREE.GridHelper(10, 10, darkMode ? 0x666666 : 0x888888, darkMode ? 0x333333 : 0xcccccc);
            scene.add(gridHelper);
            gridButton.style.background = darkMode ? "#4a5568" : "#e2e8f0";
        } else {
            if (gridHelper) {
                scene.remove(gridHelper);
                gridHelper = null;
            }
            gridButton.style.background = darkMode ? "#2d3748" : "white";
        }
    }, showGrid);

    // Axes toggle button
    const axesButton = createToolbarButton(
        "Axes",
        () => {
            axesVisible = !axesVisible;
            if (axesVisible) {
                axesHelper = new THREE.AxesHelper(5);
                scene.add(axesHelper);
                axesButton.style.background = darkMode ? "#4a5568" : "#e2e8f0";
            } else {
                if (axesHelper) {
                    scene.remove(axesHelper);
                    axesHelper = null;
                }
                axesButton.style.background = darkMode ? "#2d3748" : "white";
            }
        },
        showAxes
    );

    // 3D Box Frame toggle button

    function createFrameBox() {

        const boxG=new THREE.BoxGeometry(dim.width, dim.depth, dim.height,);
        const boxE=new THREE.EdgesGeometry(boxG);
        const boxM=new THREE.LineBasicMaterial({color:darkMode ? 0x666666 : 0x888888});
        const boxW=new THREE.LineSegments(boxE,boxM);
        boxW.position.set(0, 0, 0);
        return boxW;

    }

    const boxFrameButton = createToolbarButton(
        "Frame Box",
        () => {
            frameBoxVisible = !frameBoxVisible;
            if (frameBoxVisible) {
                frameBoxHelper = createFrameBox();
                scene.add(frameBoxHelper);
                boxFrameButton.style.background = darkMode ? "#4a5568" : "#e2e8f0";
            } else {
                if (frameBoxHelper) {
                    scene.remove(frameBoxHelper);
                    frameBoxHelper = null;
                }
                boxFrameButton.style.background = darkMode ? "#2d3748" : "white";
            }
        },
        showFrameBox
    );

    // Reset camera button
    const resetButton = createToolbarButton("Reset View", () => {
        controls.reset();
    });

    // Screenshot button
    const screenshotButton = createToolbarButton("Screenshot", () => {
        renderer.render(scene, camera);
        const dataURL = renderer.domElement.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "screenshot.png";
        link.href = dataURL;
        link.click();
    });

    // Add buttons to toolbar
    toolbar.appendChild(gridButton);
    toolbar.appendChild(axesButton);
    if ("plane" === kind) { toolbar.appendChild(boxFrameButton); }
    toolbar.appendChild(resetButton);
    toolbar.appendChild(screenshotButton);

    // Initial chart render
    updateChart();

    // Listen for data changes
    model.on("change:data", updateChart);
    model.on("change:dark_mode", updateBackground);

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

export default { render };
