// const fs = require('fs');
import { evaluate_cmap } from "./js-colormaps"

////////////////////////////////////////////////////////////////////////////////

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

const COLOR_LISTS_FAULT = [
    0xff2c2a, 0xff6500, 0xffa100, 0xfff100,
    0x94ff00, 0x0042ff, 0x0098ff, 0x00ebff,
    0x00ff9c, 0x11ff00, 0x5b00ff, 0xbb00ff,
    0xff00e4, 0xff007e
]

class ColorCycler
{
    constructor(colors)
    {
        if (colors.length == 0) { throw new Error('Invalid list!'); }
        this.colors = colors;
        this.idx = -1;
        this.length = this.colors.length-1;

    }

    next()
    {
        if (this.idx < this.length) { this.idx += 1; }
        else { this.idx = 0; }
        return this.colors[this.idx];
    }
}

const ColorCyclerFaults = new ColorCycler(COLOR_LISTS_FAULT);

////////////////////////////////////////////////////////////////////////////////

// TODO: csv_parser should have some contract regarding the structure of the
//       input data. see implemenation of `create_fault_line_render_data` to list
//       all the contract possibililtes. This widget expect from user otherwise
//       the widget will assumed the structure based on existing implementation
//       of these data structure:
//       1. renderData, produced by `createRenderData` in seismicSliceRenderData,
//       2. renderData, produced by `_createFaultRenderData` in seismicFaultRenderData.
// TODO: in the real-world, the data could be in the form of
// - [ ] numpy array
// - [ ] CHARISMA fault stick
// - [ ] KINGDOM fault format
// - [x] CSV
function csv_parser(data, options = { has_header: true, newline: "\r\n" })
{
    const text = data.split(options.newline);
    let headers, first, lines;
    if ( options.has_header ) {
        [first, ...lines] = text;
        headers = first.split(',');
    }
    const rows = []
    let   row  = NaN;
    lines.forEach(line => {
        if ( line.length != 0 ) {
            // const row = [];
            // line.split(',').forEach((x))
            const row = line.split(',').map(x => {
                const _row = parseFloat(x, 10);
                if (!Number.isNaN(_row)) {
                    return _row;
                } else {
                    return x;
                }
            });
            rows.push(row);
        }
    });
    return {headers, rows};

}

////////////////////////////////////////////////////////////////////////////////

export { grayscaleToRGB, ColorCycler, ColorCyclerFaults, csv_parser };
