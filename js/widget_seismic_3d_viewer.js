import * as THREE from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    containerMain3d,
    create3DToolbarButton,
    create3DToolbarSelection,
    create3DStyledSlider,
} from "./uis3D.js";

// import customMes from "./custom3dMess.json" assert { type: "json" };
import { createRenderData, updateRenderData } from "./seismicSliceRenderData"

function render_seismic_3d_viewer({ model, el, renderData }) {

    const DOWNFACTOR = 500;
    const customMes = {
        inline : {
            "type": "inline,show_label,current_label",
            "data": [0, true, "fault"]
        },
        crossline : {
            "type": "crossline,show_label,current_label",
            "data": [0, true, "fault"]
        },
        depth : {
            "type": "depth,show_label,current_label",
            "data": [0, true, "fault"]
        },
        show_label : {
            "type" : "change_all_label_slice",
            "data" : [true]
        },
        // change_label : {
        //     "type" : "change_all_label_slice",
        //     "data" : ["inline", "crossline", "depth", ]
        // }
    }


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
    const sliceSelectorDiv = container_main.querySelector('#slice-selection');
    const navigator = container_main.querySelector('#navigator');
    const generalControllersDiv = container_main.querySelector('#general-controllers');

    const container = container_main.querySelector('#canvas-container');

    const width = container_main.getBoundingClientRect().width;
    const height = model.get("height");

    // -------------------------------------------------------------------------

    const sliceOptions = ["depth", "inline", "crossline"];
    const currentIndexes = {
        depth: "current_depth_idx",
        inline: "current_inline_idx",
        crossline: "current_crossline_idx",
    }
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
        if ( sliceName == "inline" ) {
            leftc   = (-dims.crossline)/DOWNFACTOR;
            rightc  = (+dims.crossline)/DOWNFACTOR;
            topc    = (+dims.depth)/DOWNFACTOR;
            bottomc = (-dims.depth)/DOWNFACTOR;
        } else if ( sliceName == "crossline" ) {
            leftc   = (-dims.inline)/DOWNFACTOR;
            rightc  = (+dims.inline)/DOWNFACTOR;
            topc    = (+dims.depth)/DOWNFACTOR;
            bottomc = (-dims.depth)/DOWNFACTOR;
        } else if ( sliceName == "depth" ) {
            topc    = (+dims.inline)/DOWNFACTOR;
            bottomc = (-dims.inline)/DOWNFACTOR;
            leftc   = (-dims.crossline)/DOWNFACTOR;
            rightc  = (+dims.crossline)/DOWNFACTOR;
        }
    }

    const camera2DLookAtInline    = new THREE.Vector3(0, 0, +(dims.inline/ DOWNFACTOR));
    const camera2DLookAtCrossline = new THREE.Vector3(-(dims.crossline / DOWNFACTOR), 0, 0);
    const camera2DLookAtDepth     = new THREE.Vector3(0, +(dims.depth  / DOWNFACTOR), 0);
    const updateCamera2DPosition = (camera) => {
        if ( currentSlice == "inline" ) {
            camera.position.set(0, 0, (dims.crossline)/2);
            camera.lookAt(camera2DLookAtInline);
        } else if ( currentSlice == "crossline" ) {
            camera.position.set(-(dims.crossline)/2, 0, 0);
            camera.lookAt(camera2DLookAtCrossline);
        } else if ( currentSlice == "depth" ) {
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
            camera3d.position.set((dims.inline+10)/DOWNFACTOR, (dims.crossline+10)/DOWNFACTOR, (dims.depth+10)/DOWNFACTOR);
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

    let sliderSlice = create3DStyledSlider({
        model : model,
        sliderId : "dynamic-slider",
        min : 0,
        max : dims[sliceOptions[currentSliceIndex]],
        index : currentSliceIndex,
        sliceType : sliceOptions[currentSliceIndex],
        sliceValueByIndex : sliceValueByIndex
    });
    sliderSlice.slider.addEventListener("change", (e) => {
        const sliderValue = parseInt(parseInt(e.target.value));
        sliceValueByIndex[currentSliceIndex] = sliderValue;
        model.send({
            type: customMes[sliceOptions[currentSliceIndex]].type,
            data: [
                sliceValueByIndex[currentSliceIndex],
                showLabel,
                currentLabel
            ]
        })
        sliderSlice.setValue(sliceValueByIndex[currentSliceIndex], sliceOptions[currentSliceIndex], dims, currentSliceIndex);
    });


    // 3D Slice slider and navigator
    const viewCurrentSliceButton = create3DToolbarSelection(model, "Select Slice to Show", sliceOptions, () => {});
    viewCurrentSliceButton.addEventListener("change", (e) => {
        currentSlice = sliceOptions[parseInt(e.target.value)];
        currentSliceIndex = parseInt(e.target.value);

        // sliceOptions.forEach((slice, idx) => {
        //     if (slice === currentSlice) {
        //         currentSliceIndex = idx;
        //     }
        // });

        model.send({
            type: customMes[sliceOptions[currentSliceIndex]].type,
            data: [
                sliceValueByIndex[currentSliceIndex],
                showLabel,
                currentLabel
            ]
        });

        sliderSlice.setValue(sliceValueByIndex[currentSliceIndex], currentSlice, dims, currentSliceIndex);
        if (is2DView) {
            updateCamera2DProperties(currentSlice);
        }
        updateCameraMode();
        model.save_changes();
    })

    const buttonNextSlice = create3DToolbarButton(model, `▶`, () => {
        const newVal = sliceValueByIndex[currentSliceIndex] + sliderSlice.getValueIncre();
        const maxDim = dims[sliceOptions[currentSliceIndex]]-1;
        if (sliceValueByIndex[currentSliceIndex] <= maxDim) {
            sliceValueByIndex[currentSliceIndex] = maxDim <= newVal ? maxDim : newVal;
            model.send({
                type: customMes[sliceOptions[currentSliceIndex]].type,
                data: [
                    sliceValueByIndex[currentSliceIndex],
                    showLabel,
                    currentLabel
                ]
            });
        }
        sliderSlice.setValue(sliceValueByIndex[currentSliceIndex], sliceOptions[currentSliceIndex], dims, currentSliceIndex);
    });
    const buttonPrevSlice = create3DToolbarButton(model, `◀`, () => {
        const newVal = sliceValueByIndex[currentSliceIndex] - sliderSlice.getValueIncre();
        if (sliceValueByIndex[currentSliceIndex] >= 0) {
            sliceValueByIndex[currentSliceIndex] = 0 >= newVal ? 0 : newVal;
            model.send({
                type: customMes[sliceOptions[currentSliceIndex]].type,
                data: [
                    sliceValueByIndex[currentSliceIndex],
                    showLabel,
                    currentLabel
                ]
            });
        }
        sliderSlice.setValue(sliceValueByIndex[currentSliceIndex], sliceOptions[currentSliceIndex], dims, currentSliceIndex);

    });

    // Label selection
    const labelDiv    = document.createElement("div");
    labelDiv.style.display = "flex";
    labelDiv.style.gap = "8px";
    const labelShow  = create3DToolbarButton(model, !showLabel ? "Show Label": "Hide Label", () => {
        showLabel = !showLabel;
        labelShow.textContent = !showLabel ? "Show Label" : "Hide Label";
        model.send({
            type: customMes["show_label"].type,
            data: [
                sliceValueByIndex[currentSliceIndex],
                showLabel,
                currentLabel
            ]
        });
    });
    const labelSelect = create3DToolbarSelection(model, "Label", labelOptions, () => {})
    labelSelect.addEventListener("change", (e) => {
        currentLabel = labelOptions[parseInt(e.target.value)];
        labelOptions.forEach((slice, idx) => {
            if (slice === currentLabel) {
                currentLabelIndex = idx;
                model.send({
                    type: customMes["show_label"].type,
                    data: [
                        sliceValueByIndex[currentSliceIndex],
                        showLabel,
                        currentLabel
                    ]
                });
            }
        });
    })

    // navigator.appendChild(viewModeButton);

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
        const boxG=new THREE.BoxGeometry((dims.crossline)/(DOWNFACTOR), (dims.depth)/(DOWNFACTOR), (dims.inline)/(DOWNFACTOR),);
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
        // const msg = {type: "is-dark-mode", data: isDarkMode};
        model.set("dark_mode", isDarkMode);
        model.save_changes();
        updateBackground();
    });

    const startx = +(dims.inline    / (2));
    const startz = -(dims.crossline / (2));
    const starty = +(dims.depth     / (2));
    const spanThroughSelections = [ "depth", "inline", "crossline" ];
    const startIndexes = { inline: startx, crossline: startz, depth: starty, };

    // update initial renderData
    spanThroughSelections.forEach((plane) => { renderData[plane].updatePos(startIndexes[plane]); });
    // renderData["depth"].updateRenderData(model.get("depth_slice"), "base");
    // renderData["inline"].updateRenderData(model.get("inline_slice"), "base");
    // renderData["crossline"].updateRenderData(model.get("crossline_slice"), "base");
    // if (renderData["depth"].hasLabel) {renderData["depth"].updateRenderData(model.get("depth_slice_labels"), "label");}
    // if (renderData["inline"].hasLabel) {renderData["inline"].updateRenderData(model.get("inline_slice_labels"), "label");}
    // if (renderData["crossline"].hasLabel) {renderData["crossline"].updateRenderData(model.get("crossline_slice_labels"), "label");}

    let dataToRender = [ ];
    const updateStateChange = () => {

        let idx = 0;
        model.get("_data").forEach((plane) => {
            dataToRender.push({
                span_through: plane.span_through,
                is_label: plane.base.is_label,
                index: plane.index,
                show_label: plane.show_label,
                alpha: plane.alpha,
                cmap: plane.cmap,
            });
            if (dataToRender[idx].index != renderData[dataToRender[idx].span_through].index) {
                renderData[dataToRender[idx].span_through].index = dataToRender[idx].index
            }
            renderData[dataToRender[idx].span_through].updatePos(startIndexes[dataToRender[idx].span_through]);
            renderData[dataToRender[idx].span_through].updateRenderData(plane.base, "base");

            if (plane.has_label) {
                dataToRender.push({
                    span_through: plane.span_through,
                    is_label: plane.label.is_label,
                    index: plane.index,
                    show_label: plane.show_label,
                    alpha: plane.alpha,
                    cmap: plane.cmap,
                });
                renderData[dataToRender[idx+1].span_through].updateRenderData(plane.label, "label");
                idx += 1;
            }
            idx += 1;


        })

    }

    const updateChartPlane = () => {
        const doShowLabel = showLabel;
        let rendered = [];

        dataToRender.forEach((plane, idx) => {
            //  all of this field should be EXACTLY the same as the model.get('data')
            //  fields sent from Python. in this case, model.get('data')[0].span_trhough
            //  should be
            //  1. depth
            //  2. inline
            //  3. crossline
            if (spanThroughSelections.includes(plane.span_through)) {
                renderData[plane.span_through]["is2DView"] = is2DView
                if (!plane.is_label) {
                    // renderData[plane.span_through].updateRenderData(plane, "base");
                    scene.add(renderData[plane.span_through]["base"].mesh);
                    rendered.push({
                        slice: plane.span_through, label: false,
                        render: renderData[plane.span_through]["base"].mesh
                    })
                } else {
                    if (plane.show_label && renderData[plane.span_through].hasLabel) {
                        // renderData[plane.span_through].updateRenderData(plane, "label");
                        scene.add(renderData[plane.span_through]["label"].mesh);
                        rendered.push({
                            slice: plane.span_through, label: true,
                            render: renderData[plane.span_through]["label"].mesh
                        });
                    }
                }
            } else {
                console.log("what the funkc");
            }

        });

        rendered.forEach((obj) => { chartObjects.push(obj); });
        dataToRender = [];

    }

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
        dataToRender = [];
    }

    // Create the proper hierarchy
    sliceSelectorDiv.appendChild(viewCurrentSliceButton);

    navigator.appendChild(sliderSlice.container);
    navigator.appendChild(buttonPrevSlice);
    navigator.appendChild(buttonNextSlice);

    generalControllersDiv.appendChild(boxFrameButton);
    labelDiv.appendChild(labelShow);
    labelDiv.appendChild(labelSelect);
    if (labelOptions.length > 0) { generalControllersDiv.appendChild(labelDiv); }
    generalControllersDiv.appendChild(resetButton);
    generalControllersDiv.appendChild(darkModeButton);

    toolbar.appendChild(sliceSelectorDiv);
    toolbar.appendChild(navigator);
    toolbar.appendChild(generalControllersDiv);

    // // Make sure the canvas also scales properly
    // renderer.domElement.style.width = "100%";
    // renderer.domElement.style.height = "auto"; // or set a specific aspect ratio
    // renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    container_main.appendChild(toolbar);
    container_main.appendChild(container);
    el.appendChild(container_main);

    updateStateChange();
    updateChart();

    // Listen for data changes
    model.on("change:_data", () => {updateStateChange(), updateChart();});

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
