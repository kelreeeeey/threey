import * as THREE from "three";
import { grayscaleToRGB, } from "./utils"

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
        pos: { value: {x:0, y:0, z:0}, writeable: true, enumerable: true },

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

        // Update texture based on renderDataKey, it should be either base or label;
        updateRenderData: {
            value: function(plane, renderDataKey) {
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
                this[renderDataKey].mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
            },
            writable: false,
            enumerable: false
        },

        updatePos: {
            value: function(startPosition) {
                if (this.planeSpan == "inline") {
                    this.pos.x = 0;
                    this.pos.y = 0;
                    this.pos.z = (startPosition - this.index) / this.downFactor;
                } else if (this.planeSpan == "crossline") {
                    this.pos.x = (startPosition + this.index) / this.downFactor;
                    this.pos.y = 0;
                    this.pos.z = 0;
                } else if (this.planeSpan == "depth") {
                    this.pos.x = 0;
                    this.pos.y = (startPosition - this.index) / this.downFactor;
                    this.pos.z = 0;
                } else {
                    this.pos.x = 0;
                    this.pos.y = 0;
                    this.pos.z = 0;
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


function initSeismicSlicesRenderData (
    data = {
        downFactor: 500,
        dims : {},
        labelOptions : [],
        is2DView : false
    }
) {

    //  all of this field should be EXACTLY the same as the model.get('data')
    //  fields sent from Python. in this case, model.get('data')[0].span_trhough
    //  should be
    //  1. depth
    //  2. inline
    //  3. crossline
    const renderData = Object.create(null, {
        depth : {
            value : createRenderData({
                planeSpan: "depth",
                downFactor: data.downFactor,
                width: data.dims.inline,
                height: data.dims.crossline,
                index: 0,
                cmapBase: "seismic",
                hasLabel: (data.labelOptions.length > 0) ? true : false,
                cmapLabel: "gray",
                is2DView: data.is2DView,
            }),
            writable : false, enumerable: false
        },
        inline : {
            value : createRenderData({
                planeSpan: "inline",
                downFactor: data.downFactor,
                width: data.dims.crossline,
                height: data.dims.depth,
                index: 0,
                cmapBase: "seismic",
                hasLabel: (data.labelOptions.length > 0) ? true : false,
                cmapLabel: "gray",
                is2DView: data.is2DView,
            }),
            writable : false, enumerable: false
        },
        crossline : {
            value : createRenderData({
                planeSpan: "crossline",
                downFactor: data.downFactor,
                width: data.dims.inline,
                height: data.dims.depth,
                index: 0,
                cmapBase: "seismic",
                hasLabel: (data.labelOptions.length > 0) ? true : false,
                cmapLabel: "gray",
                is2DView: data.is2DView,
            }),
            writable : false, enumerable: false
        }

    });

    renderData.depth.base.mesh.rotation.x = (-Math.PI/2);
    renderData.depth.base.mesh.rotation.z = (Math.PI/2);
    renderData.depth.base.texture.flipY = true;
    renderData.depth.base.texture.flipX = true;
    renderData.depth.base.texture.flipZ = true;
    if (renderData.depth.hasLabel) {
        renderData.depth.label.mesh.rotation.x = (-Math.PI/2)
        renderData.depth.label.mesh.rotation.z = (Math.PI/2);
        renderData.depth.label.texture.flipY = true;
        renderData.depth.label.texture.flipX = true;
        renderData.depth.label.texture.flipZ = true;
    }

    renderData.inline.base.mesh.rotation.y=0;
    renderData.inline.base.texture.flipY = true;
    renderData.inline.base.texture.flipX = true;
    renderData.inline.base.texture.flipZ = true;
    if (renderData.inline.hasLabel) {
        renderData.inline.label.mesh.rotation.y=0;
        renderData.inline.label.texture.flipY = true;
        renderData.inline.label.texture.flipX = true;
        renderData.inline.label.texture.flipZ = true;
    }

    renderData.crossline.base.mesh.rotation.y=+Math.PI/2;
    renderData.crossline.base.texture.flipY = true;
    renderData.crossline.base.texture.flipX = false;
    renderData.crossline.base.texture.flipZ = false;
    if (renderData.crossline.hasLabel) {
        renderData.crossline.label.mesh.rotation.y=+Math.PI/2;
        renderData.crossline.label.texture.flipY = true;
        renderData.crossline.label.texture.flipX = false;
        renderData.crossline.label.texture.flipZ = false;
    }

    return renderData;
};

export { createRenderData, initSeismicSlicesRenderData };
