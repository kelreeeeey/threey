import "./widget.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { evaluate_cmap } from "./js-colormaps"

function render({model, el}) {

    const sliceOptions = ["Inline", "Crossline", "Depth Slice"];
    let currentSlice = sliceOptions[0];
    let currentSliceIndexOptions = [0, 0, 0];
    let currentSliceIndex = 0;

    sliceOptions.forEach((slice, idx) => {
        if (slice === currentSlice) {
            currentSliceIndex = idx;
        }
    });

    const labelOptions = model.get('label_list');
    let currentLabel = model.get("current_label");
    let currentLabelIndexOptions = [""];
    let currentLabelIndex = 0;
    if (labelOptions) {
        if (labelOptions.length >= 1) {
            currentLabel = labelOptions[0];
            currentLabelIndex = 0;
            labelOptions.forEach((slice, idx) => {
                if (slice === currentLabel) {
                    currentLabelIndex = idx;
                }
            });
        } else {
            currentLabel = "";
            currentLabelIndex = 0;
        }
    }

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

    const createToolbarSelection = (text, selections, onClick, isActive = false) => {
        // Label selection
        const labelSelect = document.createElement("select");
        labelSelect.style.padding = "6px 12px";
        labelSelect.style.border = "1px solid #cbd5e0";
        labelSelect.style.borderRadius = "4px";
        labelSelect.style.background = model.get("dark_mode") ? "#4a5568" : "white";
        labelSelect.style.color = model.get("dark_mode") ? "white" : "black";
        labelSelect.innerHTML = ``;
        if (selections) {
            let clab = 0;
            selections.forEach((lab) => {
                labelSelect.innerHTML += `
                    <option value="${clab}">${lab}</option>
                `;
                clab += 1;
            });
        }
        // labelSelect

        return labelSelect
    }

    function createStyledSlider(sliderId, min, max, value, sliceType) {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "8px";
        container.style.margin = "4px 0";

        const label = document.createElement("div");
        label.textContent = `${sliceType}`;
        label.style.color = model.get("dark_mode") ? "white" : "black";
        label.style.fontSize = "14px";
        label.style.minWidth = "60px";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = sliderId;
        slider.min = min.toString();
        slider.max = max.toString();
        slider.value = currentSliceIndexOptions[value].toString();
        slider.style.flex = "1";
        slider.style.padding = "4px 0";
 
        const valueSpan = document.createElement("div");
        valueSpan.id = `label_${sliderId}`;
        valueSpan.style.color = model.get("dark_mode") ? "white" : "black";
        valueSpan.style.fontSize = "14px";
        valueSpan.style.minWidth = "30px";
        valueSpan.style.textAlign = "center";

        // Assemble
        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(valueSpan);

        // Event listener - send message when slider changes
        slider.addEventListener("input", function() {
            const sliderValue = parseInt(this.value);
            valueSpan.textContent = sliderValue;

            currentSliceIndexOptions[value] = sliderValue;
            currentSlice = sliceType;

            // Send message to Python
            model.send({
                type: `data-${label.textContent}`, 
                data: sliderValue
            });
        });

        // Initialize value
        valueSpan.textContent = slider.value;

        return {
            container: container,
            slider: slider,
            getValue: () => parseInt(slider.value),
            setValue: (newValue, newSliceType, value) => {
                slider.value = newValue.toString();
                currentSliceIndexOptions[value] = newValue;
                currentSlice = newSliceType;
                label.textContent = `${newSliceType}`;
                slider.max = (dim[value]-1).toString();
                valueSpan.textContent = newValue.toString();
            }
        };
    }


    let data = model.get("data");

    let is2DView = model.get("is_2d_view");
    const viewModeButton = createToolbarButton("2D View", () => {
        is2DView = !is2DView;
        viewModeButton.textContent = !is2DView ? "3D View" : "2D View";
        const msg = {type: "is-2d-view", data: is2DView};
        // // console.log("sending message", msg);
        model.send(msg);
    });

    const viewCurrentSliceButton = createToolbarSelection("Select Slice to Show", sliceOptions, () => {})
    viewCurrentSliceButton.addEventListener("change", (e) => {
        currentSlice = sliceOptions[parseInt(e.target.value)];
        const msg = {type: "slice-to-show", data: currentSlice};
        // // console.log("sending message", currentSlice);
        model.send(msg);
        sliceOptions.forEach((slice, idx) => {
            if (slice === currentSlice) {
                currentSliceIndex = idx;
                sliderSlice.setValue(currentSliceIndexOptions[idx], slice, idx);
            }
        });
    });

    const dim = model.get("dimension");
    const dims = model.get("dimensions");


    let sliderSlice = createStyledSlider(
        0,
        0,
        dim[currentSliceIndex],
        currentSliceIndex,
        sliceOptions[currentSliceIndex],
    );

    const buttonNextSlice = createToolbarButton(`Next ▶`, () => {
        if (currentSliceIndexOptions[currentSliceIndex] <= dim[currentSliceIndex]) {
            currentSliceIndexOptions[currentSliceIndex] = sliderSlice.getValue() + 1;
            sliderSlice.setValue(currentSliceIndexOptions[currentSliceIndex], sliceOptions[currentSliceIndex], currentSliceIndex);
            model.send({type: `data-${currentSlice}`, data: currentSliceIndexOptions[currentSliceIndex]});
        }
    });
    const buttonPrevSlice = createToolbarButton(`◀ Prev`, () => {
        if (currentSliceIndexOptions[currentSliceIndex] >= 1) {
            currentSliceIndexOptions[currentSliceIndex] = sliderSlice.getValue() - 1;
            sliderSlice.setValue(currentSliceIndexOptions[currentSliceIndex], sliceOptions[currentSliceIndex], currentSliceIndex);
            model.send({type: `data-${currentSlice}`, data: currentSliceIndexOptions[currentSliceIndex]});
        }
    });

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

    // Label selection
    const labelDiv    = document.createElement("div");
    labelDiv.style.display = "flex";
    labelDiv.style.gap = "8px";

    let showLabel = false;
    const labelShow  = createToolbarButton("Show Label", () => {
        showLabel = !showLabel;
        labelShow.textContent = !showLabel ? "Show Label" : "Hide Label";
        const msg = {type: "is-show-label", data: showLabel};
        model.send(msg);
    });
    const labelSelect = createToolbarSelection("Label", labelOptions, () => {})
    labelSelect.addEventListener("change", (e) => {
        currentLabel = labelOptions[parseInt(e.target.value)];
        const msg = {type: "label-to-show", data: currentLabel};
        model.send(msg);
        labelOptions.forEach((slice, idx) => {
            if (slice === currentLabel) {
                currentLabelIndex = idx;
                const msg = {type: "label-to-select", data: slice};
                model.send(msg);
            }
        });
    });

    labelDiv.appendChild(labelShow);
    labelDiv.appendChild(labelSelect);
    const navigator = document.createElement("div");
    navigator.style.display = "flex";
    navigator.style.width = model.get("width") + "px";
    navigator.style.gap = "8px";
    navigator.appendChild(viewModeButton);
    navigator.appendChild(viewCurrentSliceButton);
    navigator.appendChild(buttonPrevSlice);
    navigator.appendChild(sliderSlice.container);
    navigator.appendChild(buttonNextSlice);

    // Create canvas container
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = model.get("width") + "px";
    container.style.height = model.get("height") + "px";
    container.style.border = "color; black";
    container.style.borderRadius = "6px";
    container.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    const darkMode = model.get("dark_mode");
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
    if (dims) {
        camera.position.set(dims.inline+10, dims.crossline+10, dims.depth+10);
    } else {
        camera.position.set(5, 5, 5);
    }

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);


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

    let frameBoxVisible = showFrameBox;
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
                const idx = i*4
                rgbArray[idx    ] = value[0]; // R
                rgbArray[idx + 1] = value[1]; // G
                rgbArray[idx + 2] = value[2]; // B
                rgbArray[idx + 3] = alpha;
                i += 1;
            }
        } else if (cmap) {
            let i = 0;
            while (i < length) {
                value = evaluate_cmap(grayscaleArray[i], plane_cmap, false);
                const idx = i*4
                rgbArray[idx    ] = value[0]; // R
                rgbArray[idx + 1] = value[1]; // G
                rgbArray[idx + 2] = value[2]; // B
                rgbArray[idx + 3] = alpha;
                i += 1;
            }
        } else {
            let i = 0;
            while (i < length) {
                value = Math.floor(grayscaleArray[i] * 255); // Normalize to 0-255
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

        console.log("data:", data.length, dims);

        data.forEach((plane) => {
            const texture = plane.texture;
            const plane_span = plane.span_through;
            const idx_plane  = plane.index;
            const alpha = plane.alpha * 255 || 255;
            const plane_cmap = plane.cmap || null;

            // let pos = plane.pos.x || 0, plane.pos.y || 0, plane.pos.z || 0;

            const geom = new THREE.PlaneGeometry(plane.width, plane.height);

            const startx = -(dim.inline  / 2);
            const starty = -(dim.depth / 2);
            const startz = +(dim.crossline  / 2);

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
            const mesh =new THREE.MeshBasicMaterial( {
                map:dataTexture,
                side:THREE.DoubleSide,
                transparent:true,
                // color: 0x000000
            });

            if ("crossline" == plane_span) {
                geom.translate(0, 0, startz - idx_plane);
            }

            if ("inline" == plane_span) {
                geom.translate(0, 0, startx + idx_plane)
            }

            if ("depth" == plane_span) {
                geom.translate(0, 0, starty + idx_plane)
            }


            const planeMesh = new THREE.Mesh(geom, mesh);

            if ( "crossline" === plane_span ) {
                planeMesh.rotation.y=-Math.PI/2;
            }

            if ( "inline" === plane_span ) {
                planeMesh.rotation.y=0;
            }

            if ( "depth" === plane_span ) {
                planeMesh.rotateX(-Math.PI/2);
            }

            planeMesh.position.set(0, 0, 0);

            scene.add(planeMesh);
            chartObjects.push(planeMesh);

        });
    }

    function updateChart() {
        clearChart();
        updateChartPlane();

    }


    // Create the proper hierarchy
    navigator.appendChild(boxFrameButton);
    navigator.appendChild(labelDiv);
    navigator.appendChild(resetButton);
    toolbar.appendChild(navigator);

    // Add canvas to container first
    container.appendChild(renderer.domElement);

    // Build the main container hierarchy
    container_main.appendChild(toolbar);
    container_main.appendChild(container);

    // Finally append to the root element
    el.appendChild(container_main);

    updateChart();

    // Listen for data changes
    model.on("change:current_label", updateChart);
    model.on("change:show_label", updateChart);
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
