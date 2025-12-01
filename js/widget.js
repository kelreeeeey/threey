import "./widget.css";
import { render_seismic_3d_viewer } from "./widget_seismic_3d_viewer.js"

function render({model, el}) {

    const _kind = model.get("_kind");

    if ("Seismic3DViewer" == _kind) {
        render_seismic_3d_viewer({model, el});
    }
}

export default { render };
