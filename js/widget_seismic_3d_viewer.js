import * as THREE from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    containerMain3d,
    create3DToolbarButton,
    create3DToolbarSelection,
    create3DStyledSlider,
} from "./uis3D.js";

import { grayscaleToRGB, createRenderData, updateRenderData } from "./utils"

function render_seismic_3d_viewer({model, el}) {

    const downFactor = 500;

    let currentSliceFromPy = model.get("current_slice");
    const dim = model.get("dimension");
    const dims = model.get("dimensions");
    let is2DView = model.get("is_2d_view");
    const labelOptions = model.get('label_list');
    let currentLabel = model.get("current_label");

    let showLabel = model.get("show_label");
    let isDarkMode = model.get("dark_mode");
    const darkMode = model.get("dark_mode");
    const showFrameBox = model.get("show_frame");

    const container_main = containerMain3d(model);
    document.body.appendChild(container_main);

    const toolbar = container_main.querySelector('#toolbar');
    const navigator = container_main.querySelector('#navigator');
    const container = container_main.querySelector('#canvas-container');

    const width = container_main.getBoundingClientRect().width;
    const height = model.get("height");

    // -------------------------------------------------------------------------

    const sliceOptions = ["Inline", "Crossline", "Depth Slice"];
    let currentSlice = sliceOptions[0];
    let sliceValueByIndex = [0, 0, 0];
    let currentSliceIndex = 0;
    sliceOptions.forEach((slice, idx) => {
        if (slice === currentSlice) {
            currentSliceIndex = idx;
            currentSlice = slice;
        }
    });

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


    let leftc, rightc, topc, bottomc
    const updateCamera2DProperties = (sliceName) => {
        if ( sliceName == "Inline" ) {
            leftc   = (-dims.crossline)/downFactor;
            rightc  = (+dims.crossline)/downFactor;
            topc    = (+dims.depth)/downFactor;
            bottomc = (-dims.depth)/downFactor;
        } else if ( sliceName == "Crossline" ) {
            leftc   = (-dims.inline)/downFactor;
            rightc  = (+dims.inline)/downFactor;
            topc    = (+dims.depth)/downFactor;
            bottomc = (-dims.depth)/downFactor;
        } else if ( sliceName == "Depth Slice" ) {
            topc    = (+dims.inline)/downFactor;
            bottomc = (-dims.inline)/downFactor;
            leftc   = (-dims.crossline)/downFactor;
            rightc  = (+dims.crossline)/downFactor;
        }
    }

    const camera2DLookAtInline    = new THREE.Vector3(0, 0, +(dims.inline / 2));
    const camera2DLookAtCrossline = new THREE.Vector3(-(dims.crossline  / 2), 0, 0);
    const camera2DLookAtDepth     = new THREE.Vector3(0, +(dims.depth   / 2), 0);
    const updateCamera2DPosition = (camera) => {
        if ( currentSlice == "Inline" ) {
            camera.position.set(0, 0, (dims.crossline)/2);
            camera.lookAt(camera2DLookAtInline);
        } else if ( currentSlice == "Crossline" ) {
            camera.position.set(-(dims.crossline)/2, 0, 0);
            camera.lookAt(camera2DLookAtCrossline);
        } else if ( currentSlice == "Depth Slice" ) {
            camera.position.set(0, (dims.depth)/2, 0);
            camera.lookAt(camera2DLookAtDepth);
        }
    }
    updateCamera2DProperties(currentSliceFromPy);

    let camera, controls;
    const camera2d = new THREE.OrthographicCamera(leftc, rightc, topc, bottomc, 0, 1000 );
    const camera3d = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const updateCamera3DPos = () => {
        if (dims) {
            camera3d.position.set((dims.inline+10)/downFactor, (dims.crossline+10)/downFactor, (dims.depth+10)/downFactor);
        } else {
            camera3d.position.set(5, 5, 5);
        }
    }
    updateCamera3DPos();

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const handleWidthChange = (newWidth, newHeight) => {
        renderer.setSize(newWidth, newHeight);
        updateCameraMode();

        if (!is2DView) {
            camera.aspect = newWidth / newHeight;
        } else {
            camera.aspect = newWidth / newHeight;
            updateCamera2DProperties(currentSlice);
        }

        camera.updateProjectionMatrix();
    }

    // Create ResizeObserver to watch for width changes
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const width = entry.contentRect.width;
            const height = model.get("height");
            handleWidthChange(width, height);
        }
    });

    // Start observing the element
    resizeObserver.observe(container_main);
    renderer.setSize(width, height);

    const updateCameraMode = () => {
        if (is2DView) {
            camera = camera2d;
            updateCamera2DPosition(camera);
            controls = new OrbitControls(camera, renderer.domElement);
            controls.addEventListener( 'lock', function () {
                menu.style.display = 'none';
            } );
            controls.addEventListener( 'unlock', function () {
                menu.style.display = 'block';
            } );
            camera.updateProjectionMatrix();

        } else {
            camera = camera3d;
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }
    }
    updateCameraMode();

    // Reset camera button
    const resetButton = create3DToolbarButton(model, "Reset View", () => {
        if (is2DView) { updateCamera2DProperties(currentSlice); }
        else          {     updateCamera3DPos(); }
        updateCameraMode();
    });

    const viewModeButton = create3DToolbarButton(model, !is2DView ? "Change to 2D View" : "Change to 3D View", () => {
        is2DView = !is2DView;
        viewModeButton.textContent = !is2DView ? "Change to 2D View" : "Change to 3D View";
        const msg = {type: "is-2d-view", data: is2DView};
        model.send(msg);
        if (is2DView) { updateCamera2DProperties(currentSlice); }
        else          {     updateCamera3DPos(); }
        updateCameraMode();
    });

    // 3D Slice slider and navigator
    const viewCurrentSliceButton = create3DToolbarSelection(model, "Select Slice to Show", sliceOptions, (e) => {
        currentSlice = sliceOptions[parseInt(e.target.value)];
        sliceOptions.forEach((slice, idx) => {
            if (slice === currentSlice) {
                currentSliceIndex = idx;
                sliderSlice.setValue(sliceValueByIndex[idx], slice, dim, idx);
                currentSlice = slice;
                if (is2DView) { updateCamera2DProperties(currentSlice); }
                updateCameraMode();
                model.send({ type: `data-${currentSlice}`, data: sliceValueByIndex[currentSliceIndex] });
            }
        });
    });

    let sliderSlice = create3DStyledSlider({
        model : model,
        sliderId : "dynamic-slider",
        min : 0,
        max : dim[currentSliceIndex],
        index : currentSliceIndex,
        sliceType : sliceOptions[currentSliceIndex],
        sliceValueByIndex : sliceValueByIndex
    });
    sliderSlice.slider.addEventListener("change", (e) => {
        const sliderValue = parseInt(parseInt(e.target.value));
        sliceValueByIndex[currentSliceIndex] = sliderValue;
        sliderSlice.setValue(sliceValueByIndex[currentSliceIndex], sliceOptions[currentSliceIndex], dim, currentSliceIndex);
        model.send({ type: `data-${sliceOptions[currentSliceIndex]}`, data: sliceValueByIndex[currentSliceIndex] });
        // model.send({type: "current-slice", data: sliceOptions[currentSliceIndex]});
    });

    const buttonNextSlice = create3DToolbarButton(model, `Next ▶`, () => {
        if (sliceValueByIndex[currentSliceIndex] <= dim[currentSliceIndex]) {
            sliceValueByIndex[currentSliceIndex] = sliderSlice.getValue() + 1;
            sliderSlice.setValue(sliceValueByIndex[currentSliceIndex], sliceOptions[currentSliceIndex], dim, currentSliceIndex);
            model.send({ type: `data-${sliceOptions[currentSliceIndex]}`, data: sliceValueByIndex[currentSliceIndex] });
            // model.send({type: "current-slice", data: sliceOptions[currentSliceIndex]});
        }
    });
    const buttonPrevSlice = create3DToolbarButton(model, `◀ Prev`, () => {
        if (sliceValueByIndex[currentSliceIndex] >= 1) {
            sliceValueByIndex[currentSliceIndex] = sliderSlice.getValue() - 1;
            sliderSlice.setValue(sliceValueByIndex[currentSliceIndex], sliceOptions[currentSliceIndex], dim, currentSliceIndex);
            model.send({ type: `data-${sliceOptions[currentSliceIndex]}`, data: sliceValueByIndex[currentSliceIndex] });
            // model.send({type: "current-slice", data: sliceOptions[currentSliceIndex]});
        }
    });

    // Label selection
    const labelDiv    = document.createElement("div");
    labelDiv.style.display = "flex";
    labelDiv.style.gap = "8px";
    const labelShow  = create3DToolbarButton(model, !showLabel ? "Show Label": "Hide Label", () => {
        showLabel = !showLabel;
        labelShow.textContent = !showLabel ? "Show Label" : "Hide Label";
        const msg = {type: "is-show-label", data: showLabel};
        model.send(msg);
    });
    const labelSelect = create3DToolbarSelection(model, "Label", labelOptions, (e) => {
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
    })
    labelDiv.appendChild(labelShow);
    labelDiv.appendChild(labelSelect);

    navigator.appendChild(viewModeButton);
    navigator.appendChild(viewCurrentSliceButton);
    navigator.appendChild(buttonPrevSlice);
    navigator.appendChild(sliderSlice.container);
    navigator.appendChild(buttonNextSlice);

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(darkMode ? 0x1a1a1a : 0xffffff);

    function updateBackground() {
        scene.background = null;
        scene.background = new THREE.Color(model.get("dark_mode") ? 0x1a1a1a : 0xffffff);
    }

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

    let chartObjects = [];

    // 3D Box Frame toggle button
    function createFrameBox() {
        const boxG=new THREE.BoxGeometry((dims.crossline)/downFactor, (dims.depth)/downFactor, (dims.inline)/downFactor,);
        const boxE=new THREE.EdgesGeometry(boxG);
        const boxM=new THREE.LineBasicMaterial({color:darkMode ? 0x666666 : 0x888888});
        const boxW=new THREE.LineSegments(boxE,boxM);
        boxW.position.set(0, 0, 0);
        return boxW;
    }

    const boxFrameButton = create3DToolbarButton(
        model,
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


    const darkModeButton = create3DToolbarButton(model, !isDarkMode ? "Togle Light Mode" : "Togle Dark Mode", () => {
        isDarkMode = !isDarkMode;
        darkModeButton.textContent = !isDarkMode ? "Togle Light Mode" : "Togle Dark Mode";
        const msg = {type: "is-dark-mode", data: isDarkMode};
        model.send(msg);
        updateBackground();
    });


    let inlineRenderData = createRenderData({
        planeSpan: "inline",
        downFactor: downFactor,
        width: dims.crossline,
        height: dims.depth,
        index: 0,
        cmapBase: "seismic",
        hasLabel: (labelOptions.length > 0) ? true : false,
        cmapLabel: "gray",
        is2DView: is2DView,
    });

    let crosslineRenderData = createRenderData({
        planeSpan: "crossline",
        downFactor: downFactor,
        width: dims.inline,
        height: dims.depth,
        index: 0,
        cmapBase: "seismic",
        hasLabel: (labelOptions.length > 0) ? true : false,
        cmapLabel: "gray",
        is2DView: is2DView,
    });

    let depthRenderData = createRenderData({
        planeSpan: "depth",
        downFactor: downFactor,
        width: dims.inline,
        height: dims.crossline,
        index: 0,
        cmapBase: "seismic",
        hasLabel: (labelOptions.length > 0) ? true : false,
        cmapLabel: "gray",
        is2DView: is2DView,
    });


    depthRenderData.base.mesh.rotation.x = (-Math.PI/2);
    depthRenderData.base.mesh.rotation.z = (Math.PI/2);
    depthRenderData.base.texture.flipY = true;
    depthRenderData.base.texture.flipX = true;
    depthRenderData.base.texture.flipZ = true;

    inlineRenderData.base.mesh.rotation.y=0;
    inlineRenderData.base.texture.flipY = true;
    inlineRenderData.base.texture.flipX = true;
    inlineRenderData.base.texture.flipZ = true;

    crosslineRenderData.base.mesh.rotation.y=+Math.PI/2;
    crosslineRenderData.base.texture.flipY = true;
    crosslineRenderData.base.texture.flipX = false;
    crosslineRenderData.base.texture.flipZ = false;

    if (labelOptions.length > 0) {
        depthRenderData.label.mesh.rotation.x = (-Math.PI/2)
        depthRenderData.label.mesh.rotation.z = (Math.PI/2);
        depthRenderData.label.texture.flipY = true;
        depthRenderData.label.texture.flipX = true;
        depthRenderData.label.texture.flipZ = true;

        inlineRenderData.label.mesh.rotation.y=0;
        inlineRenderData.label.texture.flipY = true;
        inlineRenderData.label.texture.flipX = true;
        inlineRenderData.label.texture.flipZ = true;

        crosslineRenderData.label.mesh.rotation.y=+Math.PI/2;
        crosslineRenderData.label.texture.flipY = true;
        crosslineRenderData.label.texture.flipX = false;
        crosslineRenderData.label.texture.flipZ = false;
    }

    const startx = +(dims.inline     / 2);
    const startz = -(dims.crossline  / 2);
    const starty = +(dims.depth      / 2);


    depthRenderData.updateRenderData(model.get("depth_slice"), starty, "base");
    if (depthRenderData.hasLabel) {depthRenderData.updateRenderData(model.get("depth_slice"), starty, "label");}

    inlineRenderData.updateRenderData(model.get("il_slice"), startx, "base");
    if (inlineRenderData.hasLabel) {inlineRenderData.updateRenderData(model.get("il_slice"), startx, "label");}

    crosslineRenderData.updateRenderData(model.get("xl_slice"), startz, "base");
    if (crosslineRenderData.hasLabel) {crosslineRenderData.updateRenderData(model.get("xl_slice"), startz, "label");}

    const updateChartPlane = () => {

        const dataToRender = model.get("data");
        const doShowLabel = showLabel;

        let rendered = [];

        dataToRender.forEach((plane, idx) => {

            if ("depth" == plane.span_through) {
                depthRenderData.is2DView = is2DView
                if (plane.index != depthRenderData.index) { depthRenderData.index = plane.index }

                if (!plane.is_label) {
                    depthRenderData.updateRenderData(plane, starty, "base");
                    // depthUpdate(plane, starty, depthRenderData, "base");
                    scene.add(depthRenderData.base.mesh);
                    rendered.push({
                        slice: "Depth Slice", label: false,
                        render: depthRenderData.base.mesh
                    })
                } else {
                    if (doShowLabel && depthRenderData.hasLabel) {
                        depthRenderData.updateRenderData(plane, starty, "label");
                        // depthUpdate(plane, starty, depthRenderData, "label");
                        scene.add(depthRenderData.label.mesh);
                        rendered.push({
                            slice: "Depth Slice", label: true,
                            render: depthRenderData.label.mesh
                        });
                    }
                }

            } else if ("inline" == plane.span_through) {
                inlineRenderData.is2DView = is2DView;
                if (plane.index != inlineRenderData.index) {
                    inlineRenderData.index = plane.index
                }

                if (!plane.is_label) {
                    inlineRenderData.updateRenderData(plane, startx, "base");
                    // inlineUpdate(plane, startx, inlineRenderData, "base");
                    scene.add(inlineRenderData.base.mesh);
                    rendered.push({
                        slice: "Inline", label: false,
                        render: inlineRenderData.base.mesh
                    });
                } else {
                    if (doShowLabel && inlineRenderData.hasLabel) {
                        inlineRenderData.updateRenderData(plane, startx, "label");
                        // inlineUpdate(plane, startx, inlineRenderData, "label");
                        scene.add(inlineRenderData.label.mesh);
                        rendered.push({
                            slice: "Inline", label: true,
                            render: inlineRenderData.label.mesh
                        });
                    }
                }
            } else if ("crossline" == plane.span_through) {
                crosslineRenderData.is2DView = is2DView;
                if (plane.index != crosslineRenderData.index) {
                    crosslineRenderData.index = plane.index
                }

                if (!plane.is_label) {
                    crosslineRenderData.updateRenderData(plane, startz, "base");
                    // crosslineUpdate(plane, startz, crosslineRenderData, "base")
                    scene.add(crosslineRenderData.base.mesh);
                    rendered.push({
                        slice: "Crossline", label: false,
                        render: crosslineRenderData.base.mesh
                    })
                } else {
                    if (doShowLabel && crosslineRenderData.hasLabel ) {
                        crosslineRenderData.updateRenderData(plane, startz, "label");
                        // crosslineUpdate(plane, startz, crosslineRenderData, "label")
                        scene.add(crosslineRenderData.label.mesh);
                        rendered.push({
                            slice: "Crossline", label: true,
                            render: crosslineRenderData.label.mesh
                        })
                    }
                }
            } else {
                console.log("what the funkc");
            }

        });

        rendered.forEach((obj) => {
            chartObjects.push(obj);
        });

    }

    // const sliceOptions = ["Inline", "Crossline", "Depth Slice"];
    const clearChart = () => {
        chartObjects.forEach((obj) => {
            scene.remove(obj.render);
            if (obj.render.geometry) obj.render.geometry.dispose();
            if (obj.render.material) obj.render.material.dispose();
            obj = {}
        });
        chartObjects = [];
    }

    function updateChart() {
        clearChart();
        updateChartPlane();
        console.log("len chartObjects", chartObjects.length);
    }

    // Create the proper hierarchy

    navigator.appendChild(boxFrameButton);
    navigator.appendChild(labelDiv);
    navigator.appendChild(resetButton);
    navigator.appendChild(darkModeButton);
    toolbar.appendChild(navigator);

    // // Make sure the canvas also scales properly
    // renderer.domElement.style.width = "100%";
    // renderer.domElement.style.height = "auto"; // or set a specific aspect ratio
    // renderer.domElement.style.display = "block";

    // add canvas to container first
    container.appendChild(renderer.domElement);

    // build the main container hierarchy
    container_main.appendChild(toolbar);
    container_main.appendChild(container);

    // finally append to the root element
    el.appendChild(container_main);

    updateChart();

    // Listen for data changes
    model.on("change:show_label", updateChart);
    model.on("change:is_2d_view", updateChart);
    model.on("change:data", updateChart);
    model.on("change:current_slice", updateChart);
    model.on("change:current_label", updateChart);

    model.on("change:dark_mode", updateBackground);

    // Animation loop
    let animationId;
    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!is2DView) controls.update();
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

export { render_seismic_3d_viewer };
