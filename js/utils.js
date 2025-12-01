import * as THREE from "three";
import { evaluate_cmap } from "./js-colormaps"

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

function createRenderData( initialData = {
    planeSpan: "inline",
    downFactor: 5,
    width: 10,
    height: 10,
    index: 0,
    cmapBase: "seismic",
    hasLabel: false,
    cmapLabel: "gray",
    is2DView: false,
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
        is2DView: { value: initialData.is2DView || false, writable: true, enumerable: false },

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

        // Add the updateRenderData method
        updateRenderData: {
            value: function(plane, startPosition, renderDataKey) {
                // Update texture data
                if (plane.is_rgba) {
                    this[renderDataKey].image.data.set(plane.texture)
                } else {
                    grayscaleToRGB(plane.texture, plane.width * plane.height, plane.alpha * 255, plane.cmap, this[renderDataKey].rgbArray);
                    this[renderDataKey].image.data.set(this[renderDataKey].rgbArray)
                }
                this[renderDataKey].texture.map = this[renderDataKey].image;
                this[renderDataKey].texture.needsUpdate = true;
                this[renderDataKey].meshBasicMaterial.map = this[renderDataKey].texture
                this[renderDataKey].mesh.material = this[renderDataKey].meshBasicMaterial

                // Update position based on planeSpan and is2DView
                this.updatePosition(startPosition, renderDataKey);
            },
            writable: false,
            enumerable: false
        },

        // Helper method to update position
        updatePosition: {
            value: function(startPosition, renderDataKey) {
                const position = this.calculatePosition(startPosition, renderDataKey);
                this[renderDataKey].mesh.position.set(position.x, position.y, position.z);
            },
            writable: false,
            enumerable: false
        },

        // Method to calculate position based on planeSpan and is2DView
        calculatePosition: {
            value: function(startPosition, renderDataKey) {

                switch (this.planeSpan) {
                    case "inline":
                        if (!this.is2DView) {
                            return { x: 0, y: 0, z: (startPosition - this.index) / this.downFactor };
                        } else {
                            return { x: 0, y: 0, z: startPosition / this.downFactor };
                        }

                    case "crossline":
                        if (!this.is2DView) {
                            return { x: (startPosition + this.index) / this.downFactor, y: 0, z: 0 };
                        } else {
                            return { x: startPosition / this.downFactor, y: 0, z: 0 };
                        }

                    case "depth":
                        if (!this.is2DView) {
                            return { x: 0, y: (startPosition - this.index) / this.downFactor, z: 0 };
                        } else {
                            return { x: 0, y: this.index / this.downFactor, z: 0 };
                        }

                    default:
                        return { x: 0, y: 0, z: 0 };
                }
            },
            writable: false,
            enumerable: false
        }

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

const updateRenderData = (plane, renderData, renderDataKey) => {
    if (plane.is_rgba) {
        renderData[renderDataKey].image.data.set(plane.texture)
    } else {
        grayscaleToRGB(plane.texture, plane.width * plane.height, plane.alpha * 255, plane.cmap, renderData[renderDataKey].rgbArray);
        renderData[renderDataKey].image.data.set(renderData[renderDataKey].rgbArray)
    }
    renderData[renderDataKey].texture.map = renderData[renderDataKey].image;
    renderData[renderDataKey].texture.needsUpdate = true;
    renderData[renderDataKey].meshBasicMaterial.map = renderData[renderDataKey].texture
    renderData[renderDataKey].mesh.material = renderData[renderDataKey].meshBasicMaterial
}

export { grayscaleToRGB, createRenderData, updateRenderData };
