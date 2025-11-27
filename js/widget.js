import "./widget.css";

import * as THREE from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { evaluate_cmap } from "./js-colormaps"

function createRenderData( initialData = {
    planeSpan: "inline",
    downFactor: 5,
    width: 10,
    height: 10,
    index: 0,
    cmapBase: "seismic",
    hasLabel: false,
    cmapLabel: "gray",
}) {

    if (initialData.width && initialData.width <= 0) {
        throw new Error('initialData.width should not be 0');
    }
    if (initialData.height && initialData.height <= 0) {
        throw new Error('initialData.height should not be 0');
    }

    const renderData = Object.create(null, {

        // Read-only properties
        // Writable properties with initial values from parameters
        planeSpan : { value: initialData.planeSpan || "inline", writable: false, enumerable: false },
        width: { value: initialData.width || 0, writable: false, enumerable: false },
        height: { value: initialData.height || 0, writable: false, enumerable: false },
        downFactor : { value: initialData.downFactor || 1, writable: false, enumerable: false },

        // writeable properties

        index: { value: initialData.index || 0, writable: true, enumerable: false },

        base : {
            value: Object.create(null, {
                cmap: { value: initialData.cmapBase || "seismic", writable: true, enumerable: false },
                rgbArray: {
                    value: new Uint8ClampedArray(initialData.width * initialData.height * 4),
                    writable: true, enumerable: false
                },
                image: { value: null, writable: true, enumerable: false },
                geometry: {
                    value: new THREE.PlaneGeometry( initialData.width/initialData.downFactor, initialData.height/initialData.downFactor,),
                    writable: true, enumerable: false
                },
                meshBasicMaterial: {
                    value: new THREE.MeshBasicMaterial({map:null, side:THREE.DoubleSide, transparent:true}),
                    writable: true, enumerable: false
                },
                texture : { value: null, writable: true, enumerable: false },
                mesh : { value: null, writable: true, enumerable: false },

            }),
            writeable: true,
            enumerable: false,
        },

        hasLabel: { value: initialData.hasLabel, writeable: true, enumerable: true },

        label : {
            value: initialData.hasLabel
                ? Object.create(null, {
                    cmap: { value: initialData.hasLabel ? initialData.cmapLabel : "gray", writable: true, enumerable: false },
                    rgbArray: {
                        value: initialData.hasLabel ? new Uint8ClampedArray(initialData.width * initialData.height * 4) : null,
                        writable: true, enumerable: false
                    },
                    image: { value: null, writable: true, enumerable: false },
                    geometry: {
                        value: initialData.hasLabel ? new THREE.PlaneGeometry( initialData.width/initialData.downFactor, initialData.height/initialData.downFactor,) : null,
                        writable: true, enumerable: false
                    },
                    meshBasicMaterial: {
                        value: initialData.hasLabel ? new THREE.MeshBasicMaterial({map:null, side:THREE.DoubleSide, transparent:true}) : null,
                        writable: true, enumerable: false
                    },
                    texture : { value: null, writable: true, enumerable: false },
                    mesh : { value: null, writable: true, enumerable: false },

                })
                : null,
            writeable: true,
            enumerable: false,
        },

    });

    renderData.base.image = new ImageData(renderData.base.rgbArray, initialData.width, initialData.height);
    renderData.base.texture = new THREE.Texture(renderData.base.image);
    renderData.base.mesh = new THREE.Mesh(renderData.base.geometry, renderData.base.meshBasicMaterial);

    renderData.base.texture.needsUpdate = true;
    renderData.base.texture.generateMipmaps = false;
    renderData.base.texture.magFilter = THREE.LinearFilter;
    renderData.base.texture.minFilter = THREE.LinearFilter;

    if (initialData.hasLabel) {
        renderData.label.image = new ImageData(renderData.label.rgbArray, initialData.width, initialData.height);
        renderData.label.texture = new THREE.Texture(renderData.label.image);
        renderData.label.mesh = new THREE.Mesh(renderData.label.geometry, renderData.label.meshBasicMaterial);

        renderData.label.texture.needsUpdate = true;
        renderData.label.texture.generateMipmaps = false;
        renderData.label.texture.magFilter = THREE.LinearFilter;
        renderData.label.texture.minFilter = THREE.LinearFilter;

    }


    return renderData;
}

function render({model, el}) {

    const downFactor = 500;

    let currentSliceFromPy = model.get("current_slice");
    const dim = model.get("dimension");
    const dims = model.get("dimensions");
    let is2DView = model.get("is_2d_view");
    const labelOptions = model.get('label_list');
    let currentLabel = model.get("current_label");

    let showLabel = model.get("show_label");
    const darkMode = model.get("dark_mode");
    const showFrameBox = model.get("show_frame");
    // Camera setup
    const width  = model.get("width");
    const height = model.get("height");
    let isDarkMode = model.get("dark_mode");

    // -------------------------------------------------------------------------

    const sliceOptions = ["Inline", "Crossline", "Depth Slice"];
    let currentSlice = sliceOptions[0];

    let currentSliceIndexOptions = [0, 0, 0];
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
        const labelSelect = document.createElement("div");
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
                    <label style="display: inline-block; margin-right: 12px; cursor: pointer;">
                        <input type="radio" name="toolbarSelection" value="${clab}" style="margin-right: 4px;"> ${lab} </label> `;
                clab += 1;
            });
        }
        // labelSelect

        return labelSelect
    }

    // // selection dropdown
    // const createToolbarSelection = (text, selections, onClick, isActive = false) => {
    //     // Label selection
    //     const labelSelect = document.createElement("select");
    //     labelSelect.style.padding = "6px 12px";
    //     labelSelect.style.border = "1px solid #cbd5e0";
    //     labelSelect.style.borderRadius = "4px";
    //     labelSelect.style.background = model.get("dark_mode") ? "#4a5568" : "white";
    //     labelSelect.style.color = model.get("dark_mode") ? "white" : "black";
    //     labelSelect.innerHTML = ``;
    //     if (selections) {
    //         let clab = 0;
    //         selections.forEach((lab) => {
    //             labelSelect.innerHTML += `
    //                 <option value="${clab}">${lab}</option>
    //             `;
    //             clab += 1;
    //         });
    //     }
    //     // labelSelect
    //
    //     return labelSelect
    // }

    // selection radio button
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

        // // Event listener - send message when slider changes
        slider.addEventListener("input", (value) => {
            const sliderValue = parseInt(sliderSlice.slider.value);
            valueSpan.textContent = sliderValue;

            const idx = value
            currentSliceIndexOptions[idx] = sliderValue;
            currentSlice = label.textContent;

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
            valueSpan : valueSpan,
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


    // let dataIl = model.get("data_il");
    // let dataXl = model.get("data_xl");
    // let dataZ  = model.get("data_z");
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

    // const startx = +(dims.inline     / 2);
    // const startz = -(dims.crossline  / 2);
    // const starty = +(dims.depth      / 2);

    const camera2DLookAtInline    = new THREE.Vector3(0, 0, +(dims.inline     / 2));
    const camera2DLookAtCrossline = new THREE.Vector3(-(dims.crossline  / 2), 0, 0);
    const camera2DLookAtDepth     = new THREE.Vector3(0, +(dims.depth      / 2), 0);
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

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    const updateCameraMode = () => {
        if (is2DView) {
            camera = camera2d;
            updateCamera2DPosition(camera);
            // Controls
            // controls = new PointerLockControls(camera, renderer.domElement);
            controls = new OrbitControls(camera, renderer.domElement);
            controls.addEventListener( 'lock', function () {
                menu.style.display = 'none';
            } );
            controls.addEventListener( 'unlock', function () {
                menu.style.display = 'block';
            } );

        } else {
            camera = camera3d;
            if (dims) {
                camera.position.set((dims.inline+10)/downFactor, (dims.crossline+10)/downFactor, (dims.depth+10)/downFactor);
            } else {
                camera.position.set(5, 5, 5);
            }
            // Controls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }
        camera.updateProjectionMatrix();
    }
    updateCameraMode();

    // Reset camera button
    const resetButton = createToolbarButton("Reset View", () => {
        if (is2DView) { updateCamera2DProperties(currentSlice); }
        updateCameraMode();
        if (!is2DView) { controls.reset(); }
    });


    const viewModeButton = createToolbarButton(!is2DView ? "Change to 2D View" : "Change to 3D View", () => {
        is2DView = !is2DView;
        viewModeButton.textContent = !is2DView ? "Change to 2D View" : "Change to 3D View";
        const msg = {type: "is-2d-view", data: is2DView};
        model.send(msg);
        if (is2DView) { updateCamera2DProperties(currentSlice); }
        updateCameraMode();
        if (!is2DView) { controls.reset(); }

    });

    const viewCurrentSliceButton = createToolbarSelection("Select Slice to Show", sliceOptions, () => {})
    viewCurrentSliceButton.addEventListener("change", (e) => {
        currentSlice = sliceOptions[parseInt(e.target.value)];
        const msg = {type: "slice-to-show", data: currentSlice};
        sliceOptions.forEach((slice, idx) => {
            if (slice === currentSlice) {
                currentSliceIndex = idx;
                sliderSlice.setValue(currentSliceIndexOptions[idx], slice, idx);
                currentSlice = slice;
                if (is2DView) { updateCamera2DProperties(currentSlice); }
                updateCameraMode();
            }
        });
        model.send(msg);
        model.send({type: "current-slice", data: currentSlice});
    });

    let sliderSlice = createStyledSlider(
        0,
        0,
        dim[currentSliceIndex],
        currentSliceIndex,
        sliceOptions[currentSliceIndex],
    );

    sliderSlice.slider.addEventListener("change", (e) => {
        const sliderValue = parseInt(parseInt(e.target.value));
        currentSliceIndexOptions[currentSliceIndex] = sliderValue;
        sliderSlice.setValue(currentSliceIndexOptions[currentSliceIndex], sliceOptions[currentSliceIndex], currentSliceIndex);
        // Send message to Python
        model.send({type: `data-${currentSlice}`, data: sliderValue });
        model.send({type: "current-slice", data: sliceOptions[currentSliceIndex]});
    });

    const buttonNextSlice = createToolbarButton(`Next ▶`, () => {
        if (currentSliceIndexOptions[currentSliceIndex] <= dim[currentSliceIndex]) {
            currentSliceIndexOptions[currentSliceIndex] = sliderSlice.getValue() + 1;
            sliderSlice.setValue(currentSliceIndexOptions[currentSliceIndex], sliceOptions[currentSliceIndex], currentSliceIndex);
            model.send({type: `data-${currentSlice}`, data: currentSliceIndexOptions[currentSliceIndex]});
            model.send({type: "current-slice", data: sliceOptions[currentSliceIndex]});
        }
    });
    const buttonPrevSlice = createToolbarButton(`◀ Prev`, () => {
        if (currentSliceIndexOptions[currentSliceIndex] >= 1) {
            currentSliceIndexOptions[currentSliceIndex] = sliderSlice.getValue() - 1;
            sliderSlice.setValue(currentSliceIndexOptions[currentSliceIndex], sliceOptions[currentSliceIndex], currentSliceIndex);
            model.send({type: `data-${currentSlice}`, data: currentSliceIndexOptions[currentSliceIndex]});
            model.send({type: "current-slice", data: sliceOptions[currentSliceIndex]});
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

    console.log("showLabel:, ", showLabel);
    const labelShow  = createToolbarButton(!showLabel ? "Show Label": "Hide Label", () => {
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

    // Store chart objects for updates
    let chartObjectsInline = [];
    let chartObjectsCrossline = [];
    let chartObjectsDepth = [];
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


    const darkModeButton = createToolbarButton(!isDarkMode ? "Togle Light Mode" : "Togle Dark Mode", () => {
        isDarkMode = !isDarkMode;
        darkModeButton.textContent = !isDarkMode ? "Togle Light Mode" : "Togle Dark Mode";
        const msg = {type: "is-dark-mode", data: isDarkMode};
        model.send(msg);
        updateBackground();
    });

    // Convert grayscale to RGB
    function grayscaleToRGB(grayscaleArray, length, alpha, plane_cmap, constRgbArray) {
        if (!constRgbArray) {
            const rgbArray = new Uint8Array(length * 4);
            // const max_gr = grayscaleArray.sort((grayscaleArray,b)=>b.y-grayscaleArray.y)[0].y
            // const min_gr = grayscaleArray.sort((grayscaleArray,b)=>grayscaleArray.y-b.y)[0].y
            // // const min_gr = Math.min(grayscaleArray);
            let value = null;
            if (plane_cmap) {
                grayscaleArray.forEach((it, i) => {
                    const idx = (i*4)
                    if (isNaN(it)) {
                        rgbArray[idx    ] = 0; // R
                        rgbArray[idx + 1] = 0; // G
                        rgbArray[idx + 2] = 0; // B
                        rgbArray[idx + 3] = 0;
                    } else {
                        value = evaluate_cmap(it, plane_cmap, false);
                        rgbArray[idx    ] = value[0]; // R
                        rgbArray[idx + 1] = value[1]; // G
                        rgbArray[idx + 2] = value[2]; // B
                        rgbArray[idx + 3] = alpha;
                    }
                });
            } else if (cmap) {
                grayscaleArray.forEach((it, i) => {
                    value = evaluate_cmap(it, cmap, false);
                    const idx = (i*4)
                    rgbArray[idx    ] = value[0]; // R
                    rgbArray[idx + 1] = value[1]; // G
                    rgbArray[idx + 2] = value[2]; // B
                    rgbArray[idx + 3] = alpha;
                });
            } else {
                grayscaleArray.forEach((it, i) => {
                    value = Math.floor(it * 255); // Normalize to 0-255
                    const idx = i*4
                    rgbArray[idx    ] = value; // R
                    rgbArray[idx + 1] = value; // G
                    rgbArray[idx + 2] = value; // B
                    rgbArray[idx + 3] = alpha;
                    i += 1;
                });
            }
            return rgbArray;
        } else {
            let value = null;
            if (plane_cmap) {
                grayscaleArray.forEach((it, i) => {
                    value = evaluate_cmap(it, plane_cmap, false);
                    const idx = (i*4)
                    constRgbArray[idx    ] = value[0]; // R
                    constRgbArray[idx + 1] = value[1]; // G
                    constRgbArray[idx + 2] = value[2]; // B
                    constRgbArray[idx + 3] = alpha;
                });
            } else if (cmap) {
                grayscaleArray.forEach((it, i) => {
                    value = evaluate_cmap(it, cmap, false);
                    const idx = (i*4)
                    constRgbArray[idx    ] = value[0]; // R
                    constRgbArray[idx + 1] = value[1]; // G
                    constRgbArray[idx + 2] = value[2]; // B
                    constRgbArray[idx + 3] = alpha;
                });
            } else {
                let i = 0;
                grayscaleArray.forEach((it, i) => {
                    value = Math.floor(it * 255); // Normalize to 0-255
                    const idx = i*4
                    constRgbArray[idx    ] = value; // R
                    constRgbArray[idx + 1] = value; // G
                    constRgbArray[idx + 2] = value; // B
                    constRgbArray[idx + 3] = alpha;
                    i += 1;
                });

            }
            return null;
        }
    }

    let inlineRenderData = createRenderData({
        planeSpan: "inline",
        downFactor: downFactor,
        width: dims.crossline,
        height: dims.depth,
        index: 0,
        cmapBase: "seismic",
        hasLabel: (labelOptions.length > 0) ? true : false,
        cmapLabel: "gray",
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

    // function updateChartInlinePlane(data) {
    //     data.forEach((plane, idx) => {
    //         const texture = plane.texture;
    //         const idx_plane  = plane.index;
    //         const alpha = plane.alpha * 255 || 255;
    //         const plane_cmap = plane.cmap || null;
    //         const isLabel = plane.is_label;
    //     });
    // }
    // function updateChartCrosslinePlane(data) {
    //     data.forEach((plane, idx) => {
    //         const texture = plane.texture;
    //         const plane_span = plane.span_through;
    //         const idx_plane  = plane.index;
    //         const alpha = plane.alpha * 255 || 255;
    //         const plane_cmap = plane.cmap || null;
    //         const isLabel = plane.is_label;
    //     });
    // };
    //
    // function updateChartDepthPlane(data){
    //     data.forEach((plane, idx) => {
    //     });
    // }

    const startx = +(dims.inline     / 2);
    const startz = -(dims.crossline  / 2);
    const starty = +(dims.depth      / 2);

    const depthUpdateBase = (data = {plane: null, starty: starty}) => {
        grayscaleToRGB(data.plane.texture, data.plane.width * data.plane.height, data.plane.alpha * 255, data.plane.cmap, depthRenderData.base.rgbArray);
        depthRenderData.base.image.data.set(depthRenderData.base.rgbArray)
        depthRenderData.base.texture.map = depthRenderData.base.image;
        depthRenderData.base.texture.needsUpdate = true;
        depthRenderData.base.meshBasicMaterial.map = depthRenderData.base.texture
        depthRenderData.base.mesh.material = depthRenderData.base.meshBasicMaterial
        if (!is2DView) {
            depthRenderData.base.mesh.position.set(0, (starty - depthRenderData.index)/depthRenderData.downFactor, 0);
        } else {
            depthRenderData.base.mesh.position.set(0, (depthRenderData.index)/depthRenderData.downFactor, 0);
        }
    }

    const depthUpdateLabel = (data = {plane: null, starty: starty}) => {
        grayscaleToRGB(data.plane.texture, data.plane.width * data.plane.height, data.plane.alpha * 255, data.plane.cmap, depthRenderData.label.rgbArray);
        depthRenderData.label.image.data.set(depthRenderData.label.rgbArray)
        depthRenderData.label.texture.map = depthRenderData.label.image;
        depthRenderData.label.texture.needsUpdate = true;
        depthRenderData.label.meshBasicMaterial.map = depthRenderData.label.texture
        depthRenderData.label.mesh.material = depthRenderData.label.meshBasicMaterial
        if (!is2DView) {
            depthRenderData.label.mesh.position.set(0, (starty - depthRenderData.index)/depthRenderData.downFactor, 0);
        } else {
            depthRenderData.label.mesh.position.set(0, (depthRenderData.index)/depthRenderData.downFactor, 0);
        }
    }

    const inlineUpdateBase = (plane, startx, doShowLabel) => {
        grayscaleToRGB(plane.texture, plane.width * plane.height, plane.alpha * 255, plane.cmap, inlineRenderData.base.rgbArray);
        inlineRenderData.base.image.data.set(inlineRenderData.base.rgbArray)
        inlineRenderData.base.texture.map = inlineRenderData.base.image;
        inlineRenderData.base.texture.needsUpdate = true;
        inlineRenderData.base.meshBasicMaterial.map = inlineRenderData.base.texture
        inlineRenderData.base.mesh.material = inlineRenderData.base.meshBasicMaterial
        if (!is2DView) {
            inlineRenderData.base.mesh.position.set(0, 0, (startx - inlineRenderData.index)/inlineRenderData.downFactor);
        } else {
            inlineRenderData.base.mesh.position.set(0, 0, (startx)/inlineRenderData.downFactor);
        }
    }

    const inlineUpdateLabel = (plane, startx, doShowLabel) => {
        grayscaleToRGB(plane.texture, plane.width * plane.height, plane.alpha * 255, plane.cmap, inlineRenderData.label.rgbArray);
        inlineRenderData.label.image.data.set(inlineRenderData.label.rgbArray)
        inlineRenderData.label.texture.map = inlineRenderData.label.image;
        inlineRenderData.label.texture.needsUpdate = true;
        inlineRenderData.label.meshBasicMaterial.map = inlineRenderData.label.texture
        inlineRenderData.label.mesh.material = inlineRenderData.label.meshBasicMaterial
        inlineRenderData.label.mesh.position.set(0, 0, (startx - inlineRenderData.index)/inlineRenderData.downFactor);
        if (!is2DView) {
            inlineRenderData.label.mesh.position.set(0, 0, (startx - inlineRenderData.index)/inlineRenderData.downFactor);
        } else {
            inlineRenderData.label.mesh.position.set(0, 0, (startx)/inlineRenderData.downFactor);
        }
    }

    const crosslineUpdateBase = (plane, startz, doShowLabel) => {
        grayscaleToRGB(plane.texture, plane.width * plane.height, plane.alpha * 255, plane.cmap, crosslineRenderData.base.rgbArray);
        crosslineRenderData.base.image.data.set(crosslineRenderData.base.rgbArray)
        crosslineRenderData.base.texture.map = crosslineRenderData.base.image;
        crosslineRenderData.base.texture.needsUpdate = true;
        crosslineRenderData.base.meshBasicMaterial.map = crosslineRenderData.base.texture
        crosslineRenderData.base.mesh.material = crosslineRenderData.base.meshBasicMaterial
        crosslineRenderData.base.mesh.position.set((startz + crosslineRenderData.index)/crosslineRenderData.downFactor, 0, 0);
        if (!is2DView) {
            crosslineRenderData.base.mesh.position.set((startz + crosslineRenderData.index)/crosslineRenderData.downFactor, 0, 0);
        } else {
            crosslineRenderData.base.mesh.position.set(startz/crosslineRenderData.downFactor, 0, 0);
        }
    }

    const crosslineUpdateLabel = (plane, startz, doShowLabel) => {
        grayscaleToRGB(plane.texture, plane.width * plane.height, plane.alpha * 255, plane.cmap, crosslineRenderData.label.rgbArray);
        crosslineRenderData.label.image.data.set(crosslineRenderData.label.rgbArray)
        crosslineRenderData.label.texture.map = crosslineRenderData.label.image;
        crosslineRenderData.label.texture.needsUpdate = true;
        crosslineRenderData.label.meshBasicMaterial.map = crosslineRenderData.label.texture
        crosslineRenderData.label.mesh.material = crosslineRenderData.label.meshBasicMaterial
        crosslineRenderData.label.mesh.position.set((startz + crosslineRenderData.index)/crosslineRenderData.downFactor, 0, 0);
        if (!is2DView) {
            crosslineRenderData.label.mesh.position.set((startz + crosslineRenderData.index)/crosslineRenderData.downFactor, 0, 0);
        } else {
            crosslineRenderData.label.mesh.position.set(startz/crosslineRenderData.downFactor, 0, 0);
        }
    }

    depthUpdateBase ({plane:model.get("depth_slice"), starty: starty});
    inlineUpdateBase (model.get("il_slice"), startx, true);
    crosslineUpdateBase (model.get("xl_slice"), startz, true);

    if (labelOptions.length > 0) {
        depthUpdateLabel({plane:model.get("depth_slice_labels"), starty: starty});
        inlineUpdateLabel(model.get("il_slice_labels"), startx, true);
        crosslineUpdateLabel(model.get("xl_slice_labels"), startz, true);
    }

    function updateChartPlane() {

        const dataToRender = model.get("data");
        const doShowLabel = showLabel;

        let rendered = [];

        dataToRender.forEach((plane, idx) => {

            const startx = +(dims.inline     / 2);
            const startz = -(dims.crossline  / 2);
            const starty = +(dims.depth      / 2);

            if ("depth" == plane.span_through) {
                if (plane.index != depthRenderData.index) {
                    depthRenderData.index = plane.index
                }

                if (!plane.is_label) {
                    depthUpdateBase({plane:plane, starty:starty});
                    scene.add(depthRenderData.base.mesh);
                    rendered.push({
                        slice: "Depth Slice", label: false,
                        render: depthRenderData.base.mesh
                    })
                } else {
                    if (doShowLabel && depthRenderData.hasLabel) {
                        depthUpdateLabel({plane:plane, starty:starty});
                        scene.add(depthRenderData.label.mesh);
                        rendered.push({
                            slice: "Depth Slice", label: true,
                            render: depthRenderData.label.mesh
                        });
                    }
                }

            } else if ("inline" == plane.span_through) {
                if (plane.index != inlineRenderData.index) {
                    inlineRenderData.index = plane.index
                }

                if (!plane.is_label) {
                    inlineUpdateBase(plane, startx);
                    scene.add(inlineRenderData.base.mesh);
                    rendered.push({
                        slice: "Inline", label: false,
                        render: inlineRenderData.base.mesh
                    });
                } else {
                    if (doShowLabel && inlineRenderData.hasLabel) {
                        inlineUpdateLabel(plane, startx);
                        scene.add(inlineRenderData.label.mesh);
                        rendered.push({
                            slice: "Inline", label: true,
                            render: inlineRenderData.label.mesh
                        });
                    }
                }
            } else if ("crossline" == plane.span_through) {
                if (plane.index != crosslineRenderData.index) {
                    crosslineRenderData.index = plane.index
                }

                if (!plane.is_label) {
                    crosslineUpdateBase(plane, startz);
                    scene.add(crosslineRenderData.base.mesh);
                    rendered.push({
                        slice: "Crossline", label: false,
                        render: crosslineRenderData.base.mesh
                    })
                } else {
                    if (doShowLabel && crosslineRenderData.hasLabel ) {
                        crosslineUpdateLabel(plane, startz);
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
            // scene.add(obj.render);
            chartObjects.push(obj);
        });

    }

    // const sliceOptions = ["Inline", "Crossline", "Depth Slice"];
    function clearChart() {
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
    }

    // Create the proper hierarchy
    navigator.appendChild(boxFrameButton);
    navigator.appendChild(labelDiv);
    navigator.appendChild(resetButton);
    navigator.appendChild(darkModeButton);
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
    model.on("change:show_label", updateChart);
    model.on("change:is_2d_view", updateChart);
    model.on("change:data", updateChart);
    model.on("change:current_slice", updateChart);
    model.on("change:current_label", updateChart);

    // model.on("change:current_il_idx", updateChart);
    // model.on("change:current_xl_idx", updateChart);
    // model.on("change:current_z_idx", updateChart);

    // model.on("change:current_il_idx", updateChartInlinePlane);
    // model.on("change:current_xl_idx", updateChartCrosslinePlane);
    // model.on("change:current_z_idx", updateChartDepthPlane);

    // model.on("change:current_il_idx", updateChartInlinePlane);
    // model.on("change:current_xl_idx", updateChartCrosslinePlane);
    // model.on("change:current_z_idx", updateChartDepthPlane);

    // model.on("change:data_il", updateChart);
    // model.on("change:data_xl", updateChart);
    // model.on("change:data_z", updateChart);

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

export default { render };
