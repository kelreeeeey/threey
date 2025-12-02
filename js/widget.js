import "./widget.css";
import { render_seismic_3d_viewer } from "./widget_seismic_3d_viewer.js"
import { initSeismicSlicesRenderData } from "./seismicSliceRenderData"

function render({model, el}) {

    const DOWNFACTOR = 500;
    const _kind = model.get("_kind");

    const is2dView = model.get("is_2d_view");
    const labelOptions = model.get('label_list');
    const dims = model.get("dimensions");

    const renderData  = initSeismicSlicesRenderData(
        {
            downFactor : DOWNFACTOR,
            dims : dims,
            labelOptions : labelOptions,
            is2dView : is2dView,
        }
    );

    if ("Seismic3DViewer" == _kind) {
        render_seismic_3d_viewer({ model, el, renderData });
    }
}

export default { render };
