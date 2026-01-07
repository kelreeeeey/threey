import * as THREE from "three";

import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { NURBSCurve } from 'three/addons/curves/NURBSCurve.js';
import { NURBSSurface } from 'three/addons/curves/NURBSSurface.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

import { ColorCycler, ColorCyclerFaults, csv_parser } from "./utils.js"
import { _sample_points, _sample_lines, _sample_surface, } from "./_sample_data_faults.js"

const FaultTypes       = { POINTS:0, LINES:1, SURFACE:2, };
const FaultTypesParent = {           LINES:1, SURFACE:2, };

const SAMPLE_DATA_LINES   = csv_parser(_sample_lines, { has_header: true, newline: "\r\n" });
const SAMPLE_DATA_SURFACE = csv_parser(_sample_surface, { has_header: true, newline: "\r\n" });

function _create_fault_points_render_data( data = {
    parent_id:       "",
    options:  { name: "", color: 0x000000, alpha: 1.00, size: 0.5, },
})
{
    const points = Object.create(null, {
        // we always create points since it the most primitive
        // object to construct a fault.
        _id:               { value: self.crypto.randomUUID(),    writable: false, enumerable: false },
        name:              { value: data.options.name, writable: false, enumerable: false },
        parent_id:         { value: data.parent_id,    writable: false, enumerable: false },
        // internal state to control which part of the fault to be shown.
        show_label:        { value: true, writable: true, enumerable: false  },
        size:              { value: data.options.size,  writable: true, enumerable: false },
        color:             { value: data.options.color, writable: true, enumerable: false },
        alpha:             { value: data.options.alpha, writable: true, enumerable: false },
        vec3_point:        { value: null,               writable: true, enumerable: false },
        vec3_color:        { value: null,               writable: true, enumerable: false },
        vec1_size :        { value: null,               writable: true, enumerable: false },
        // mesh needs geometry and meshBasicMaterial to be instantiated later
        mesh:              { value: null, writable: true, enumerble: false },
        geometry:          { value: new THREE.BufferGeometry(), writable: true, enumerable: false },
        meshBasicMaterial: {
            value: new THREE.PointsMaterial({
                color:           data.options.color,
                // opacity:         data.options.alpha,
                // transparent:     true,
                vertexColors:    true,
                sizeAttenuation: true,
            }),
            writable: true, enumerable: false
        },

        updateRenderDataGeometry: {
            value: function(){
                const vec3_point = new THREE.Float32BufferAttribute(this.vec3_point, 3)
                const vec3_color = new THREE.Float32BufferAttribute(this.vec3_color, 3)
                const vec1_size  = new THREE.Float32BufferAttribute(this.vec1_size , 1)
                this.geometry.setAttribute('position', vec3_point);
                this.geometry.setAttribute('color',    vec3_color);
                this.geometry.setAttribute('size',     vec1_size );
            },
            writable: false, enumerable: false
        },

        updateRenderDataMesh: {
            value: function(){
                // this.mesh.geometry = this.geometry;
                this.mesh.material = this.meshBasicMaterial;
                this.mesh.position.set(0, 0, 0);
                this.mesh.onBeforeCompile = (shader) => {
                    shader.vertexShader = shader.vertexShader.replace(
                        'uniform float size;',
                        'attribute float size;'
                    );
                };
            },
            writable: false, enumerable: false
        },

        updateRenderData: {
            value: function() {
                this.updateRenderDataGeometry();
                this.updateRenderDataMesh();
            },
            writable: false, enumerable: false
        },
    });
    return points;
}

function _create_fault_lines_render_data( data = {
    parent_id:       "",
    options:         { name:  "",   color: 0x000000, alpha: 0.75, size: 2.0, },
})
{
    const lines = Object.create(null, {
        _id:               { value: self.crypto.randomUUID(), writable: false, enumerable: false },
        name:              { value: data.options.name, writable: false, enumerable: false },
        parent_id:         { value: data.parent_id,    writable: false, enumerable: false },
        // internal state to control which part of the fault to be shown.
        show_label:        { value: true,                 writable: true, enumerable: false  },
        color:             { value: data.options.color,   writable: true, enumerable: false },
        alpha:             { value: data.options.alpha,   writable: true, enumerable: false },
        line_points:       { value: null,                 writable: true, enumerable: false },
        nurbs_curve:       { value: null,                 writable: true, enumerable: false },
        // mesh needs geometry and meshBasicMaterial to be instantiated later
        mesh:              { value: null,                 writable: true, enumerable: false },
        // geometry of the line needs surface points after parsing
        // data from user data later by calling geometry.setFromPoints()
        // and passing the NURBSCurve's instance, `.getPoints( 200 )`
        geometry:          { value: new THREE.BufferGeometry(), writable: true, enumerable: false },
        meshBasicMaterial: {
            // value: new LineMaterial({
            value: new THREE.LineBasicMaterial({
                color:       data.options.color,
                opacity:     data.options.alpha,
                linewidth:   data.options.size,
                transparent: false,
            }),
                writable: true, enumerable: false
        },

        updateRenderDataGeometry: {
            value: function(){
                this.geometry.setFromPoints( this.line_points );
            },
            writable: false, enumerable: false
        },

        updateRenderDataMesh: {
            value: function(){
                // this.mesh.geometry = this.geometry;
                this.mesh.material = this.meshBasicMaterial;
                this.mesh.position.set(0, 0, 0);
            },
            writable: false, enumerable: false
        },

        updateRenderData: {
            value: function() {
                this.updateRenderDataGeometry();
                this.updateRenderDataMesh();
            },
            writable: false, enumerable: false
        },

    });
    return lines;
}

function _create_fault_surface_render_data( data = {
    parent_id:       "",
    options:         { name:  "",   color: 0x000000, alpha: 0.75, },
})
{
    const surface = Object.create(null, {
        _id:               { value: self.crypto.randomUUID(), writable: false, enumerable: false },
        name:              { value: data.options.name, writable: false, enumerable: false },
        parent_id:         { value: data.parent_id,    writable: false, enumerable: false },
        // internal state to control which part of the fault to be shown.
        show_label:        { value: true,               writable: true, enumerable: false  },
        color:             { value: data.options.color, writable: true, enumerable: false },
        alpha:             { value: data.options.alpha, writable: true, enumerable: false },
        // mesh needs geometry and meshBasicMaterial to be instantiated later
        mesh:              { value: null,                       writable: true, enumerable: false },
        // geometry of the surface needs surface points after parsing
        // data from user data
        geometry:          { value: null,                       writable: true, enumerable: false },
        meshBasicMaterial: {
            value: THREE.MeshLambertMaterial({
                color:       data.options.color,
                opacity:     data.options.alpha,
                transparent: true,
                side:        THREE.DoubleSide
            }),
            writable: false, enumerable: false
        },
    });
    return surface;
}

function _createFaultRenderData( data = {
    local_dimension: {},
    type:            FaultTypes.LINES,
    name_suffix:     "",
    points_options:  { name: "", color: 0x000000, alpha: 1.00, size: 0.5, },
    lines_options:   { name: "", color: 0x000000, alpha: 0.75, },
    surface_options: { name: "", color: 0x000000, alpha: 0.50, },
})
{

    // const its_NOT_ok_to_create_surface = ( data.type != FaultTypes.POINTS || data.type != FaultTypes.LINES );
    // const its_NOT_ok_to_create_lines   = ( data.type != FaultTypes.POINTS );

    const renderData = Object.create(null, {

        _id:               { value: self.crypto.randomUUID(), writable: false, enumerable: false },
        name_suffix:       { value: data.name_suffix,         writable: false, enumerable: false },
        local_dimensions:  { value: data.local_dimensions,    writable: false, enumerable: false },
        type:              { value: data.type,                writable: true, enumerable: false },
        // points, lines, and surface should be array
        // NOTE: dev should check if those arrays have items before
        //       updating anything.
        // we always create points since it the most primitive
        // object to construct a fault.
        points:            { value: [], writable: true, enumerable: false, },
        // only create lines if data.type IS NOT POINTS
        lines:             { value: [], writable: true, enumerable: false, },
        // only create surface if data.type IS NOT POINTS or IS NOT LINES
        surface:           { value: [], writable: true, enumerable: false, },


    });

    return renderData;
}

////////////////////////////////////////////////////////////////////////////////

function create_fault_point_render_data(
    render_data = {
        local_dimension: {},
        type:            FaultTypes.POINTS,
        name_suffix:     "",
        points_options:  { name: "", color: 0x000000, alpha: 1.00, size: 0.5, },
    },
    raw_data = { headers: [], rows: [] }
)
{
    let   point_color;
    let   color_cycle;

    const pool_ids           = [];   // will be populated by the point ids
    // Each item would be a line, where each line consits of multiple points.
    const raw_vector3_points = [[]]; // NOTE: they have to be 2 dimensional array!
    const raw_vector3_colors = [[]]; // NOTE: they have to be 2 dimensional array!
    const raw_vector3_sizes  = [[]]; // NOTE: they have to be 2 dimensional array!

    const local_dimension = render_data.local_dimension;
    const down_factor     = local_dimension.downFactor;
    const start           = local_dimension.start;
    const point_alpha     = ( render_data.points_options.alpha == undefined ) ? 1.00 : render_data.points_options.alpha;
    const point_size      = ( render_data.points_options.size == undefined ) ? 0.50 : render_data.points_options.size ;

    const header_of_index = raw_data.headers.length == 0
        ? { "inline": 0, "crossline":1, "depth":2 , "_id":3, "color": 4, "alpha": 5, "size": 6 }   // NOTE: DEFAULT BASE ASSUMPTION!
        : Object.fromEntries(raw_data.headers.map((item, index) => [item, index]));

    if ( render_data.points_options.color == undefined ) {
        color_cycle = ColorCyclerFaults;
        point_color = ColorCyclerFaults.next();
    } else {
        point_color = render_data.points_options.color;
    }

    const j = raw_data.rows.length;

    let _count_id = 0;
    let _temp_id  = -1
    raw_data.rows.forEach((point, i) => {
        // see seismicSliceRenderData.js at `createRenderData -> renderData.updatePos`
        const _x = ( start['crossline'] + point[ header_of_index['crossline'] ] ) / down_factor;
        const _y = ( start['depth']     - point[ header_of_index['depth']     ] ) / down_factor;
        const _z = ( start['inline']    - point[ header_of_index['inline']    ] ) / down_factor;

        const _id = point[ header_of_index["_id"] ];
        // this conditional branch assumed that USER INPUT of `_id`, should START
        // FORM 0. so here we update all of the container if `_id` changes.
        if ( _temp_id != _id ) {
            raw_vector3_points .push([]);
            raw_vector3_colors .push([]);
            raw_vector3_sizes  .push([]);
            pool_ids.push(_id);
            // update count_id
            _count_id += 1;
            _temp_id   = _id;
            // update color
            point_color = ( render_data.points_options.color == undefined ) ? ColorCyclerFaults.next() : point_color;
        }

        const _color_from_row = header_of_index.hasOwnProperty("color") ? point[ header_of_index["color"] ] : point_color;
        const color = new THREE.Color(_color_from_row);
        raw_vector3_colors[_count_id].push(color.r, color.g, color.b);
        raw_vector3_points[_count_id].push(_x, _y, _z);
        raw_vector3_sizes [_count_id].push(point_size);

    })

    const out_render_data = _createFaultRenderData({
        local_dimension: local_dimension,
        type:            FaultTypes.POINTS,
        name_suffix:     "p-",
        points_options:  render_data.points_options,
        lines_options:   {},
        surface_options: {},
    })

    for (let o=0; o <= _count_id-1; o += 1) {

        const current_id         = pool_ids.shift();
        // points data
        const current_vec3_point = raw_vector3_points.shift();
        const current_vec3_color = raw_vector3_colors.shift();
        const current_vec3_size  = raw_vector3_sizes .shift();

        out_render_data.points.push(_create_fault_points_render_data({
            parent_id: null,
            options:   { name: `point-${current_id}`, color: current_vec3_color, alpha: point_alpha, size: point_size },
        }));
        out_render_data.points[o].vec3_point = current_vec3_point;
        out_render_data.points[o].vec3_color = current_vec3_color;
        out_render_data.points[o].vec1_size  = current_vec3_size ;
        out_render_data.points[o].updateRenderDataGeometry();
        out_render_data.points[o].mesh = new THREE.Points(
            out_render_data.points[o].geometry,
            out_render_data.points[o].meshBasicMaterial
        );
        out_render_data.points[o].updateRenderDataMesh();
    }

    return out_render_data

}

function create_fault_line_render_data(
    render_data = {
        local_dimension: {},
        type:            FaultTypes.LINES,
        name_suffix:     "",
        points_options:  { name: "", color: 0x000000, alpha: 1.00, size: 0.5, },
        lines_options:   { name: "", color: 0x000000, alpha: 0.75, },
    },
    raw_data = { headers: [], rows: [] }
)
{
    let   point_color;
    let   color_cycle;

    const pool_ids           = [];   // will be populated by the line ids
    // Each item would be a line, where each line consits of multiple points.
    const raw_vector3_points = [[]]; // NOTE: they have to be 2 dimensional array!
    const raw_vector3_colors = [[]]; // NOTE: they have to be 2 dimensional array!
    const raw_vector3_sizes  = [[]]; // NOTE: they have to be 2 dimensional array!
    const nurbs_lines_points = [[]]; // NOTE: they have to be 2 dimensional array!
    const nurbs_lines_knots  = [[]]; // NOTE: they have to be 2 dimensional array!
    const nurbs_degree       = 1;

    const local_dimension = render_data.local_dimension;
    const down_factor     = local_dimension.downFactor;
    const start           = local_dimension.start;
    const line_alpha      = ( render_data.lines_options .alpha == undefined ) ? 0.75 : render_data.lines_options.alpha;
    const point_alpha     = ( render_data.points_options.alpha == undefined ) ? 1.00 : render_data.points_options.alpha;
    const point_size      = ( render_data.points_options.size == undefined ) ? 0.50 : render_data.points_options.size ;

    const header_of_index = raw_data.headers.length == 0
        ? { "inline": 0, "crossline":1, "depth":2 , "_id":3, "color": 4, "alpha": 5, "size": 6 }   // NOTE: DEFAULT BASE ASSUMPTION!
        : Object.fromEntries(raw_data.headers.map((item, index) => [item, index]));

    if ( render_data.lines_options.color == undefined ) {
        color_cycle = ColorCyclerFaults;
        point_color = ColorCyclerFaults.next();
    // } else if ( header_of_index.hasOwnProperty("color") ) {
    //     point_color = render_data.lines_options.color;
    } else {
        point_color = render_data.lines_options.color;
    }

    const j = raw_data.rows.length;

    let _count_id = 0;
    let _temp_id  = -1
    raw_data.rows.forEach((point, i) => {
        // see seismicSliceRenderData.js at `createRenderData -> renderData.updatePos`
        const _x = ( start['crossline'] + point[ header_of_index['crossline'] ] ) / down_factor;
        const _y = ( start['depth']     - point[ header_of_index['depth']     ] ) / down_factor;
        const _z = ( start['inline']    - point[ header_of_index['inline']    ] ) / down_factor;

        const _id = point[ header_of_index["_id"] ];
        // this conditional branch assumed that USER INPUT of `_id`, should START
        // FORM 0. so here we update all of the container if `_id` changes.
        if ( _temp_id != _id+1 ) {
            raw_vector3_points .push([]);
            raw_vector3_colors .push([]);
            raw_vector3_sizes  .push([]);
            nurbs_lines_points .push([]);
            nurbs_lines_knots  .push([]);
            pool_ids.push(_id);
            // update count_id
            _count_id += 1;
            _temp_id   = _id;
            // update color
            point_color = ( render_data.lines_options.color == undefined ) ? ColorCyclerFaults.next() : point_color;
        }

        const _color_from_row = header_of_index.hasOwnProperty("color") ? point[ header_of_index["color"] ] : point_color;
        const color = new THREE.Color(_color_from_row);
        raw_vector3_colors[_temp_id].push(color.r, color.g, color.b);
        raw_vector3_points[_temp_id].push(_x, _y, _z);
        raw_vector3_sizes [_temp_id].push(point_size);

        const knot = THREE.MathUtils.clamp( ( i + 1 ) / ( j - nurbs_degree ), 0, 1);
        nurbs_lines_points[_temp_id].push( new THREE.Vector4(_x, _y, _z, 1) );
        for ( let ii = 0; ii <= nurbs_degree; ii ++ ) { nurbs_lines_knots[_temp_id].push( 0 ); }
        nurbs_lines_knots[_temp_id].push( knot );

    })

    const out_render_data = _createFaultRenderData({
        local_dimension: local_dimension,
        type:            FaultTypes.LINES,
        name_suffix:     "l-",
        points_options:  render_data.points_options,
        lines_options:   render_data.lines_options,
        surface_options: {},
    })

    for (let o=0; o <= _count_id-1; o += 1) {

        const current_id         = pool_ids.shift();
        // points data
        const current_vec3_point = raw_vector3_points.shift();
        const current_vec3_color = raw_vector3_colors.shift();
        const current_vec3_size  = raw_vector3_sizes .shift();
        // line data
        const current_line_point = nurbs_lines_points.shift();
        const current_line_knot  = nurbs_lines_knots .shift();

        out_render_data.lines.push(_create_fault_lines_render_data({
            parent_id: null,
            options:   { name: `line-${current_id}`, color: current_vec3_color, alpha: line_alpha, },
        }));
        out_render_data.lines[o].nurbs_curve = new NURBSCurve( nurbs_degree, current_line_knot, current_line_point );
        out_render_data.lines[o].line_points = current_line_point;
        // out_render_data.lines[o].updateRenderDataGeometry();
        out_render_data.lines[o].geometry.setFromPoints( current_line_point );
        out_render_data.lines[o].mesh = new THREE.Line ( out_render_data.lines[o].geometry, out_render_data.lines[o].meshBasicMaterial, );
        // out_render_data.lines[o].updateRenderDataMesh();
        out_render_data.lines[o].mesh.position.set(0, 0, 0);

        out_render_data.points.push(_create_fault_points_render_data({
            parent_id: out_render_data.lines[o].parent_id,
            options:   { name: `point-${current_id}`, color: current_vec3_color, alpha: point_alpha, size: point_size },
        }));
        out_render_data.points[o].vec3_point = current_vec3_point;
        out_render_data.points[o].vec3_color = current_vec3_color;
        out_render_data.points[o].vec1_size  = current_vec3_size ;
        out_render_data.points[o].updateRenderDataGeometry();
        out_render_data.points[o].mesh = new THREE.Points(
            out_render_data.points[o].geometry,
            out_render_data.points[o].meshBasicMaterial
        );
        out_render_data.points[o].updateRenderDataMesh();
    }

    return out_render_data

}

function separate_lines_from_surface(
    render_data = {
        local_dimension: {},
        type:            FaultTypes.SURFACE,
        name_suffix:     "",
        points_options:  { name: "", color: 0x000000, alpha: 1.00, size: 0.5, },
        lines_options:   { name: "", color: 0x000000, alpha: 0.75, },
        surface_options: { name: "", color: 0x000000, alpha: 0.50, },
    },
    raw_data = { header: [], rows: [] }
)
{

    return 

}

////////////////////////////////////////////////////////////////////////////////

export {
    FaultTypes,
    SAMPLE_DATA_LINES,
    SAMPLE_DATA_SURFACE,
    create_fault_line_render_data,
    create_fault_point_render_data,
};

