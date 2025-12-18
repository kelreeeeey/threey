import * as THREE from "three";
import  { NURBSSurface } from 'three/addons/curves/NURBSSurface.js';

const FaultTypes = {
    POINTS:             0,
    LINES:              1,
    SURFACE:            2,
    POINTS_AND_LINE:    3,
    POINTS_AND_SURFACE: 4,
    LINES_AND_SURFACE:  5,
    ALL:                6,
}

function createFaultRenderData( data = {
    inline: 10,
    crossline: 10,
    depth: 10,
    downFactor: 5,
    type: FaultTypes.POINTS,
})
{
    // make sure the main dimension inputs are valid
    if (data.inline && data.inline <= 0) { throw new Error('data.inline should not be 0'); }
    if (data.crossline && data.crossline <= 0) { throw new Error('data.crossline should not be 0'); }
    if (data.depth && data.depth <= 0) { throw new Error('data.depth should not be 0'); }

    const renderData = Object.create(null, {
        inline: { value: data.inline, writeable: false, enumerable: false },
        crossline: { value: data.crossline, writeable: false, enumerable: false },
        depth: { value: data.depth, writeable: false, enumerable: false },
        downFactor: { value: data.downFactor, writeable: false, enumerable: false },

        type: { value: data.type, writeable: true, enumerable: false },

    });

    return renderData;
}

export { createFaultRenderData, FaultTypes };
