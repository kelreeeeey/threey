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

export { grayscaleToRGB, };
