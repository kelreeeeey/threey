import "./widget.css";
import { render_seismic_3d_viewer } from "./widget_seismic_3d_viewer.js"
import { render_scatter_3d_viewer } from "./widget_scatter_3d_viewer.js"
import { initSeismicSlicesRenderData } from "./seismicSliceRenderData"
import { createLocalDimensionData } from "./seismicLocalDimensionsData"

function render({model, el}) {

    const _kind = model.get("_kind");
    const dims = model.get("dimensions");

    if ("Seismic3DViewer" == _kind) {

        const localDimension = createLocalDimensionData({
            inline: dims.inline,
            crossline: dims.crossline,
            depth: dims.depth,
            downFactor: 2,
        });


        const is2dView = model.get("is_2d_view");
        const labelOptions = model.get('label_list');

        const renderData  = initSeismicSlicesRenderData(
            {
                downFactor : localDimension.downFactor,
                dims : dims,
                labelOptions : labelOptions,
                is2dView : is2dView,
            }
        );
        render_seismic_3d_viewer({ model, el, renderData, localDimension });
    }

    if ("Scatter3DViewer" == _kind){
        render_scatter_3d_viewer({ model, el });
    }

}

export default { render };
