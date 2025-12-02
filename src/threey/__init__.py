import importlib.metadata
import pathlib

import anywidget
import traitlets
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
import copy

try:
    __version__ = importlib.metadata.version("threey")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"

try:
    from rich import print
except ModuleNotFoundError:
    print

import marimo as mo

class RendreData:
    __slots__ = (
        "plane_span",
        "width",
        "height",
        "index",
        "is_2d_view",
        "has_label",
        "show_label",

        "base",
        "base_cmap",
        "base_alpha",
        "label",
        "label_cmap",
        "label_alpha",

        "is_rgba",
    )

    def __init__(
        self,
        plane_span: str,
        width: int,
        height: int,
        index: int = 0,
        is_2d_view: bool = False,
        has_label: bool = False,
        show_label: bool = False,

        base: list = [],
        base_cmap: str = "seismic",
        base_alpha: float = 1.0,

        label: list = [],
        label_cmap: str = "gray",
        label_alpha: float = 0.5,

    ) -> None:

        self.plane_span = plane_span
        self.width = width
        self.height = height
        self.index = index

        self.is_2d_view = is_3d_view
        self.has_label = has_label

        self.base = base # base.texture
        self.base_cmap = base_cmap
        self.label = label # label.texture
        self.label_cmap = label_cmap
        self.show_label = show_label


class Seismic3DViewer(anywidget.AnyWidget):

    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    _kind = traitlets.Any().tag(sync=True)

    _data = traitlets.List().tag(sync=True)
    data = traitlets.List().tag(sync=True)
    width = traitlets.Int().tag(sync=False)
    height = traitlets.Int().tag(sync=False)

    current_slice = traitlets.Any().tag(sync=True)

    label_list = traitlets.List().tag(sync=True)
    show_label = traitlets.Bool(True).tag(sync=True)
    current_label = traitlets.Any().tag(sync=True)

    current_inline_idx = traitlets.Any().tag(sync=True)
    current_crossline_idx = traitlets.Any().tag(sync=True)
    current_depth_idx = traitlets.Any().tag(sync=True)

    kwargs_label = traitlets.Dict().tag(sync=True)

    is_2d_view = traitlets.Bool(True).tag(sync=True)

    # dimensions = {inline: int, crossline: int, depth: int}
    dimensions = traitlets.Dict().tag(sync=True)
    dimension = traitlets.List().tag(sync=True)

    width = traitlets.Int().tag(sync=True)
    height = traitlets.Int().tag(sync=True)
    show_grid = traitlets.Bool(True).tag(sync=True)
    show_axes = traitlets.Bool(True).tag(sync=True)
    show_frame = traitlets.Bool(True).tag(sync=True)
    dark_mode = traitlets.Bool(False).tag(sync=True)

    def __init__(self, *args, **kwargs):
        if "width" not in kwargs:
            kwargs.update({"width": 1000})
        if "height" not in kwargs:
            kwargs.update({"height": 1200})
        super().__init__(*args, **kwargs)

        self.on_msg(self._handle_custom_msg)
        self._kind = "Seismic3DViewer"

        # need to validate user input of `kwargs_label`
        # need to validate user input of `dimensions` tho

        # dimension "not plural", is the value of dimensions (dict[str, int])
        self.dimension = list(x for x in kwargs['dimensions'].values())
        self.label_list = list(kwargs['labels'].keys())

        self.data_source = kwargs['data_source'].obj
        self.vmin = np.nanmin(self.data_source) if not kwargs.get("vmin", False) else kwargs.get("vmin", False)
        self.vmax = np.nanmax(self.data_source) if not kwargs.get("vmax", False) else kwargs.get("vmax", False)
        self.data_source = self._normalize_data(self.data_source, vmin=self.vmin, vmax=self.vmax)
        self.labels = {x:self._normalize_data(y.obj) for x, y in kwargs['labels'].items()}

        self.current_inline_idx = 0
        self.current_crossline_idx = 0
        self.current_depth_idx  = 0

        self.current_slice = "inline"
        self.cmap_seis = plt.get_cmap("seismic")

        self._data = [
            {
                "span_through" : "depth",
                "show_label": self.show_label,
                "width" : self.dimensions['inline'],
                "height" : self.dimensions['crossline'],
                "index": self.current_depth_idx,
                "base": {
                    "alpha": 1.0,
                    "cmap": "seismic",
                    "texture" : self.convert_slice_to_texture(
                        texture = self.data_source[self.current_depth_idx],
                        axis = "depth",
                        alpha = 1.0,
                        is_label = False,
                        is_rgba = False
                    ),
                    "is_label": False,
                    "is_rgba": False
                },
                "label": None,
                "has_label": False, },

            {
                "span_through": "inline",
                "show_label": self.show_label,
                "width" : self.dimensions['crossline'],
                "height" : self.dimensions['depth'],
                "index": self.current_inline_idx,
                "base": {
                    "alpha": 1.0,
                    "cmap": "seismic",
                    "texture" : self.convert_slice_to_texture(
                        texture = self.data_source[:, self.current_inline_idx, :],
                        axis = "inline",
                        alpha = 1.0,
                        is_label = False,
                        is_rgba = False
                    ),
                    "is_label": False,
                    "is_rgba": False
                },
                "label": None,
                "has_label": False, },

            {
                "span_through" : "crossline",
                "show_label": self.show_label,
                "width" : self.dimensions['inline'],
                "height" : self.dimensions['depth'],
                "index": self.current_crossline_idx,
                "base": {
                    "alpha": 1.0,
                    "cmap": "seismic",
                    "texture" : self.convert_slice_to_texture(
                        texture = self.data_source[:, :, self.current_crossline_idx],
                        axis = "crossline",
                        alpha = 1.0,
                        is_label = False,
                        is_rgba = False
                    ),
                    "is_label": False,
                    "is_rgba": False
                },
                "label": None,
                "has_label": False, },

        ]

        if len(self.label_list) != 0:
            self.current_label = self.label_list[0]
            self.kwargs_labels = kwargs["kwargs_labels"]
            self.cmap_labels = {x:plt.get_cmap(y['cmap']) for x, y in self.kwargs_labels.items()}
            self.kwargs_label = self.kwargs_labels[self.current_label]

            self._data[0]['label'] =  {
                "alpha": self.kwargs_labels[self.current_label].get('alpha',0.5),
                "cmap": self.kwargs_labels[self.current_label].get('cmap', "gray"),
                "texture" : self.convert_slice_to_texture(
                    texture = self.labels[self.current_label][self.current_depth_idx],
                    axis = "depth",
                    alpha = self.kwargs_labels[self.current_label].get('alpha', 0.5),
                    is_label = True,
                    is_rgba = False
                ),
                "is_label": True,
                "is_rgba": False
            }
            self._data[0]["has_label"] = True

            self._data[1]['label'] = {
                "alpha": self.kwargs_labels[self.current_label].get('alpha',0.5),
                "cmap": self.kwargs_labels[self.current_label].get('cmap', "gray"),
                "texture" : self.convert_slice_to_texture(
                    texture = self.labels[self.current_label][:, self.current_inline_idx, :],
                    axis = "inline",
                    alpha = self.kwargs_labels[self.current_label].get('alpha', 0.5),
                    is_label = True,
                    is_rgba = False
                ),
                "is_label": True,
                "is_rgba": False
            }
            self._data[1]["has_label"] = True

            self._data[2]['label'] = {
                "alpha": self.kwargs_labels[self.current_label].get('alpha',0.5),
                "cmap": self.kwargs_labels[self.current_label].get('cmap', "gray"),
                "texture" : self.convert_slice_to_texture(
                    texture = self.labels[self.current_label][:, :, self.current_crossline_idx],
                    axis = "crossline",
                    alpha = self.kwargs_labels[self.current_label].get('alpha', 0.5),
                    is_label = True,
                    is_rgba = False
                ),
                "is_label": True,
                "is_rgba": False
            }
            self._data[2]["has_label"] = True

        else:
            self.current_label = None
            self.kwargs_labels = {}
            self.cmap_labels = {}
            self.kwargs_label = {}
            self.inline_slice_labels    = None
            self.crossline_slice_labels    = None
            self.depth_slice_labels = None

        self.data = copy.deepcopy(self._data)

        return None
 
    def _handle_custom_msg(self, data, buffers, *args, **kwargs):

        t = data['type']
        current_slice_index, new_show_label, new_current_label = data['data']

        self.show_label = new_show_label
        self.current_label = new_current_label

        match t:
            case "change_all_label_slice" :
                self.current_label = new_current_label
                alpha   = self.kwargs_labels[self.current_label].get('alpha', 0.5)
                cmap    = self.kwargs_labels[self.current_label].get('cmap', "gray")

                texture = self.labels[self.current_label][self.current_depth_idx]
                self.data[0]['label'].update({"texture":texture, "alpha":alpha, "cmap": cmap})
                self._data[0]['label'].update({
                    "texture" : self.convert_slice_to_texture(
                        texture = texture,
                        axis = "depth",
                        alpha = alpha,
                        is_label = True,
                        is_rgba = False
                    ),
                    "alpha": alpha,
                    "cmap": cmap,
                })

                texture = self.labels[self.current_label][:, self.current_inline_idx, :]
                self.data[1]['label'].update({"texture":texture, "alpha":alpha, "cmap": cmap})
                self._data[1]['label'].update({
                    "texture" : self.convert_slice_to_texture(
                        texture = texture,
                        axis = "inline",
                        alpha = alpha,
                        is_label = True,
                        is_rgba = False
                    ),
                    "alpha": alpha,
                    "cmap": cmap,
                })

                texture = self.labels[self.current_label][:, :, self.current_crossline_idx]
                self.data[2]['label'].update({"texture":texture, "alpha":alpha, "cmap": cmap})
                self._data[2]['label'].update({
                    "texture" : self.convert_slice_to_texture(
                        texture = texture,
                        axis = "crossline",
                        alpha = alpha,
                        is_label = True,
                        is_rgba = False
                    ),
                    "alpha": alpha,
                    "cmap": cmap,
                })

                self._data[0].update({"show_label": new_show_label})
                self._data[1].update({"show_label": new_show_label})
                self._data[2].update({"show_label": new_show_label})
                self.data[0].update({"show_label": new_show_label})
                self.data[1].update({"show_label": new_show_label})
                self.data[2].update({"show_label": new_show_label})
                self.send_state("_data")

            case "depth,show_label,current_label":
                self.current_depth_idx = current_slice_index

                self.data[0].update({ "index": current_slice_index })
                self._data[0].update({ "index": current_slice_index })

                texture = self.data_source[self.current_depth_idx]
                self.data[0].update({ "textute": texture })
                self._data[0]['base'].update({
                    "texture" : self.convert_slice_to_texture(
                        texture = texture,
                        axis = "depth",
                        alpha = 1.0,
                        is_label = False,
                        is_rgba = False
                    ),
                })
                if new_show_label:
                    texture = self.labels[self.current_label][self.current_depth_idx]
                    alpha   = self.kwargs_labels[self.current_label].get('alpha', 0.5)
                    cmap    = self.kwargs_labels[self.current_label].get('cmap', "gray")
                    self.data[0]['label'].update({"texture" : texture, "alpha": alpha, "cmap": cmap, })
                    self._data[0]['label'].update({
                        "texture" : self.convert_slice_to_texture(
                            texture = texture,
                            axis = "depth",
                            alpha = alpha,
                            is_label = True,
                            is_rgba = False
                        ),
                        "alpha": alpha,
                        "cmap": cmap,
                    })
                self.send_state("_data")

            case "inline,show_label,current_label":
                self.current_inline_idx = current_slice_index

                self.data[1].update({ "index": current_slice_index })
                self._data[1].update({ "index": current_slice_index })

                texture = self.data_source[:, self.current_inline_idx, :]
                self._data[1]['base'].update({"texture":texture})
                self._data[1]['base'].update({
                    "texture" : self.convert_slice_to_texture(
                        texture = texture,
                        axis = "inline",
                        alpha = 1.0,
                        is_label = False,
                        is_rgba = False
                    )
                })
                if new_show_label:

                    texture = self.labels[self.current_label][:, self.current_inline_idx, :]
                    alpha   = self.kwargs_labels[self.current_label].get('alpha', 0.5)
                    cmap    = self.kwargs_labels[self.current_label].get('cmap', "gray")
                    self.data[1]['label'].update({ "texture" : texture, "alpha": alpha, "cmap": cmap, })
                    self._data[1]['label'].update({
                        "texture" : self.convert_slice_to_texture(
                            texture = texture,
                            axis = "inline",
                            alpha = alpha,
                            is_label = True,
                        ),
                        "alpha": alpha,
                        "cmap": cmap,
                    })
                self.send_state("_data")

            case "crossline,show_label,current_label":
                self.current_crossline_idx = current_slice_index

                self._data[2].update({ "index": current_slice_index })
                self.data[2].update({ "index": current_slice_index })

                texture = self.data_source[:, :, self.current_crossline_idx]
                self.data[2]['base'].update({"texture":texture})
                self._data[2]['base'].update({
                    "texture": self.convert_slice_to_texture(
                        texture = texture,
                        axis = "crossline",
                        alpha = 1.0,
                        is_label = False,
                        is_rgba = False
                    )
                })
                if new_show_label:
                    texture = self.labels[self.current_label][:, :, self.current_crossline_idx]
                    alpha   = self.kwargs_labels[self.current_label].get('alpha', 0.5)
                    cmap    = self.kwargs_labels[self.current_label].get('cmap', "gray")
                    self.data[2]['label'].update({ "texture" : texture, "alpha": alpha, "cmap": cmap, })
                    self._data[2]['label'].update({
                        "texture" : self.convert_slice_to_texture(
                            texture = texture,
                            axis = "crossline",
                            alpha = alpha,
                            is_label = True,
                            is_rgba = False
                        ),
                        "alpha": alpha,
                        "cmap": cmap,
                    })
                self.send_state("_data")

            case _:
                data_to_update = {}
                base_to_update = {}
                label_to_update = {}


    def _normalize_data(self, data, vmin=None, vmax=None):
        """Normalize data to 0-1 range for texture rendering"""
        if data.dtype == np.bool_ or data.dtype == bool:
            return data.astype(np.float32)
        elif vmin != None and vmax != None:
            return (data - self.vmin) / (self.vmax - self.vmin)
        else:
            data_min = np.nanmin(data)
            data_max = np.nanmax(data)
            return (data - data_min)/(data_max - data_min)


    def convert_slice_to_texture(self, texture, axis: str, alpha: float, is_label: bool, is_rgba: bool=False) -> list[float]:
        _t = []
        if not is_rgba:
            if axis == "depth":
                _t = texture.T.flatten().astype(np.float16).tolist()
                return _t
            else:
                _t = texture.flatten().astype(np.float16).tolist()
                return _t

        else:
            if axis == "depth":
                if not is_label:
                    _t = (self.cmap_seis(texture.T.flatten(), alpha=alpha) * 255).flatten().astype(np.uint)
                    return _t
                else:
                    _t = (self.cmap_labels[self.current_label](texture.T.flatten(), alpha=alpha) * 255).flatten().astype(np.uint)
                    return _t

            else:
                if not is_label:
                    _t = (self.cmap_seis(texture.flatten(), alpha=alpha) * 255).flatten().astype(np.uint)
                    return _t
                else:
                    _t = (self.cmap_labels[self.current_label](texture.flatten(), alpha=alpha) * 255).flatten().astype(np.uint)
                    return _t

__all__ = ["Plane3DThreeWidget",]

