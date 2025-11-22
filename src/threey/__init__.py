import importlib.metadata
import pathlib

import anywidget
import traitlets
import numpy as np

try:
    __version__ = importlib.metadata.version("threey")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"

import marimo as mo

class ThreeWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    # Data for the 3D chart
    kind = traitlets.Unicode().tag(sync=True)

class ScatterThreeWidget(ThreeWidget):

    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    # Data for the 3D chart
    kind = traitlets.Unicode().tag(sync=True)
    data = traitlets.List([]).tag(sync=True)
    width = traitlets.Int(600).tag(sync=True)
    height = traitlets.Int(400).tag(sync=True)
    show_grid = traitlets.Bool(True).tag(sync=True)
    show_axes = traitlets.Bool(True).tag(sync=True)
    dark_mode = traitlets.Bool(True).tag(sync=True)

# class Plane3DThreeWidget(anywidget.AnyWidget):
#     _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
#     _css = pathlib.Path(__file__).parent / "static" / "widget.css"
#
#     # Data for the 3D chart
#     kind = traitlets.Unicode().tag(sync=True)
#     cmap = traitlets.Unicode().tag(sync=True)
#
#     data = traitlets.List([]).tag(sync=True)
#     data_source = None
#     label_source = None
#     label_list = traitlets.List([]).tag(sync=True)
#
#     # dimensions = {width: int, height: int, depth: int}
#     dimensions = traitlets.Dict().tag(sync=True)
#
#     width = traitlets.Int().tag(sync=True)
#     height = traitlets.Int().tag(sync=True)
#     show_grid = traitlets.Bool(True).tag(sync=True)
#     show_axes = traitlets.Bool(True).tag(sync=True)
#     show_frame = traitlets.Bool(True).tag(sync=True)
#     dark_mode = traitlets.Bool(True).tag(sync=True)
#
#     # Communication traits for slice data
#     data_slice_request = traitlets.Dict({}).tag(sync=True)
#     data_slice_response = traitlets.Dict({}).tag(sync=True)
#     label_slice_request = traitlets.Dict({}).tag(sync=True)
#     label_slice_response = traitlets.Dict({}).tag(sync=True)
#
#     def __init__(
#         self,
#         *args,  
#         data_source=None,  # 3D numpy array
#         label_source=None, # dict of 3D numpy arrays
#         **kwargs,
#     ):
#         kwargs.update({"kind":"plane"})
#         super(Plane3DThreeWidget, self).__init__(*args, **kwargs)
#
#         self.data_source = data_source
#         self.label_source = label_source
#         self.label_list = list(label_source.keys())
#
#         # Set dimensions from data_source if provided
#         if data_source is not None and self.dimensions is not None:
#             self.dimensions = {
#                 "width": data_source.shape[0],
#                 "height": data_source.shape[1], 
#                 "depth": data_source.shape[2]
#             }
#
#         # Set up observers for slice requests
#         self.observe(self._handle_data_slice_request, names=['data_slice_request'])
#         self.observe(self._handle_label_slice_request, names=['label_slice_request'])
#
#         return
#
#     def _handle_data_slice_request(self, change):
#         """Handle data slice requests from JavaScript"""
#         request = change['new']
#         if not request:
#             return
#
#         axis = request.get('axis', 'inline')
#         slice_index = request.get('sliceIndex', 0)
#         request_id = request.get('requestId', '')
#
#         try:
#             slice_data = self.get_data_slice(axis, slice_index)
#             if slice_data is not None:
#                 # Convert numpy array to list for JSON serialization
#                 # Normalize data to 0-1 range for texture
#                 normalized_data = self._normalize_data(slice_data)
#                 data_list = normalized_data.flatten().tolist()
#
#                 self.data_slice_response = {
#                     'requestId': request_id,
#                     'success': True,
#                     'data': data_list,
#                     'axis': axis,
#                     'sliceIndex': slice_index
#                 }
#             else:
#                 self.data_slice_response = {
#                     'requestId': request_id,
#                     'success': False,
#                     'error': 'No data available'
#                 }
#         except Exception as e:
#             self.data_slice_response = {
#                 'requestId': request_id,
#                 'success': False,
#                 'error': str(e)
#             }
#
#     def _handle_label_slice_request(self, change):
#         """Handle label slice requests from JavaScript"""
#         request = change['new']
#         if not request:
#             return
#
#         axis = request.get('axis', 'inline')
#         slice_index = request.get('sliceIndex', 0)
#         label_index = request.get('labelIndex', 0)
#         request_id = request.get('requestId', '')
#
#         try:
#             label_data = self.get_label_slice(axis, slice_index, label_index)
#             if label_data is not None:
#                 # Convert numpy array to list for JSON serialization
#                 normalized_data = self._normalize_data(label_data)
#                 data_list = normalized_data.flatten().tolist()
#
#                 self.label_slice_response = {
#                     'requestId': request_id,
#                     'success': True,
#                     'data': data_list,
#                     'axis': axis,
#                     'sliceIndex': slice_index,
#                     'labelIndex': label_index
#                 }
#             else:
#                 self.label_slice_response = {
#                     'requestId': request_id,
#                     'success': False,
#                     'error': 'No label data available'
#                 }
#         except Exception as e:
#             self.label_slice_response = {
#                 'requestId': request_id,
#                 'success': False,
#                 'error': str(e)
#             }
#
#     def _normalize_data(self, data):
#         """Normalize data to 0-1 range for texture rendering"""
#         if data.dtype == np.bool_ or data.dtype == bool:
#             return data.astype(np.float32)
#         else:
#             data_min = np.min(data)
#             data_max = np.max(data)
#             if data_max - data_min > 0:
#                 return (data - data_min) / (data_max - data_min)
#             else:
#                 return np.zeros_like(data, dtype=np.float32)
#
#     def get_data_slice(self, axis, slice_index):
#         """Get a 2D slice from the 3D data_source"""
#         if self.data_source is None:
#             return None
#
#         try:
#             if axis == "inline":
#                 if 0 <= slice_index < self.data_source.shape[0]:
#                     return self.data_source[slice_index, :, :]
#             elif axis == "crossline":
#                 if 0 <= slice_index < self.data_source.shape[1]:
#                     return self.data_source[:, slice_index, :]
#             elif axis == "depth":
#                 if 0 <= slice_index < self.data_source.shape[2]:
#                     return self.data_source[:, :, slice_index]
#         except IndexError:
#             pass
#
#         return None
#
#     def get_label_slice(self, axis, slice_index, label_index):
#         """Get a 2D slice from the specified label in label_source"""
#         if (self.label_source is None or 
#             label_index >= len(self.label_source) or
#             label_index < 0):
#             return None
#
#         label_data = self.label_source[label_index]
#         try:
#             if axis == "inline":
#                 if 0 <= slice_index < label_data.shape[0]:
#                     return label_data[slice_index, :, :]
#             elif axis == "crossline":
#                 if 0 <= slice_index < label_data.shape[1]:
#                     return label_data[:, slice_index, :]
#             elif axis == "depth":
#                 if 0 <= slice_index < label_data.shape[2]:
#                     return label_data[:, :, slice_index]
#         except IndexError:
#             pass
#
#         return None

class Plane3DThreeWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    # Data for the 3D chart
    kind = traitlets.Unicode().tag(sync=True)
    cmap = traitlets.Unicode().tag(sync=True)

    data = traitlets.List([]).tag(sync=True)
    data_source = None
    label_source = None

    # dimensions = {width: int, height: int, depth: int}
    dimensions = traitlets.Dict().tag(sync=True)

    width = traitlets.Int().tag(sync=True)
    height = traitlets.Int().tag(sync=True)
    show_grid = traitlets.Bool(True).tag(sync=True)
    show_axes = traitlets.Bool(True).tag(sync=True)
    show_frame = traitlets.Bool(True).tag(sync=True)
    dark_mode = traitlets.Bool(True).tag(sync=True)

    def __init__(
        self,
        *args,  **kwargs,
    ):
        # if "cmap" in kwargs: kwargs.update({"cmap":None})
        kwargs.update({"kind":"plane"})
        super(Plane3DThreeWidget, self).__init__(*args, **kwargs)

        return

class Zarr3DThreeWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    # Data for the 3D chart
    kind = traitlets.Unicode().tag(sync=True)
    cmap = traitlets.Unicode().tag(sync=True)

    store_path = traitlets.Unicode().tag(sync=True)
    dimensions = traitlets.List([]).tag(sync=True)
    coordinates = traitlets.List([]).tag(sync=True)

    width = traitlets.Int().tag(sync=True)
    height = traitlets.Int().tag(sync=True)
    show_grid = traitlets.Bool(True).tag(sync=True)
    show_axes = traitlets.Bool(True).tag(sync=True)
    show_frame = traitlets.Bool(True).tag(sync=True)
    dark_mode = traitlets.Bool(True).tag(sync=True)

    def __init__(
        self,
        *args,  **kwargs,
    ):
        super(Zarr3DThreeWidget, self).__init__(*args, kind="zarr", **kwargs)
        return

class Seismic3DViewer(anywidget.AnyWidget):

    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    data = traitlets.List().tag(sync=True)

    il_slice = traitlets.Any().tag(sync=True)
    xl_slice = traitlets.Any().tag(sync=True)
    depth_slice = traitlets.Any().tag(sync=True)
    width = traitlets.Int().tag(sync=True)
    height = traitlets.Int().tag(sync=True)

    kwargs_label = traitlets.Dict().tag(sync=True)
    il_slice_labels = traitlets.Any().tag(sync=True)
    xl_slice_labels = traitlets.Any().tag(sync=True)
    depth_slice_labels = traitlets.Any().tag(sync=True)

    is_2d_view = traitlets.Bool(True).tag(sync=True)
    show_label = traitlets.Bool(True).tag(sync=True)
    label_list = traitlets.List().tag(sync=True)
    current_label = traitlets.Any().tag(sync=True)

    # dimensions = {width: int, height: int, depth: int}
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
            kwargs.update({"width": 800})
        if "height" not in kwargs:
            kwargs.update({"height": 800})
        super().__init__(*args, **kwargs)

        self.dimension = list(x-1 for x in kwargs['dimensions'].values())
        self.label_list = list(kwargs['labels'].keys())

        self.data_source = self._normalize_data(kwargs['data_source'])
        self.labels = {x:self._normalize_data(y) for x, y in kwargs['labels'].items()}

        self.current_il_idx = 0
        self.current_xl_idx = 0
        self.current_z_idx  = 0

        self.il_slice = self._get_slice(
            width = self.dimensions['crossline'],
            height = self.dimensions['depth'],
            texture = self.data_source[:, self.current_il_idx, :],
            index = self.current_il_idx,
            axis = "inline",
            alpha=1,
            cmap="seismic"
        )
        self.xl_slice = self._get_slice(
            width = self.dimensions['inline'],
            height = self.dimensions['depth'],
            texture = self.data_source[:, :, self.current_xl_idx],
            index = self.current_xl_idx,
            axis = "crossline",
            alpha=1,
            cmap="seismic"
        )
        self.depth_slice = self._get_slice(
            width = self.dimensions['inline'],
            height = self.dimensions['crossline'],
            texture = self.data_source[self.current_z_idx, :, :],
            index = self.current_z_idx,
            axis = "depth",
            alpha=1,
            cmap="seismic"
        )

        self.current_label = self.label_list[0]
        self.kwargs_labels = kwargs["kwargs_labels"]
        self.kwargs_label = self.kwargs_labels[self.current_label]
        self.il_slice_labels    = self._get_slice(
            width = self.dimensions['crossline'],
            height = self.dimensions['depth'],
            texture = self.labels[self.current_label][:, self.current_il_idx, :],
            index = self.current_il_idx,
            axis = "inline",
            **self.kwargs_label
        )
        self.xl_slice_labels    = self.xl_slice_labels = self._get_slice(
            width = self.dimensions['inline'],
            height = self.dimensions['depth'],
            texture = self.labels[self.current_label][:, :, self.current_xl_idx],
            index = self.current_xl_idx,
            axis = "crossline",
            **self.kwargs_label
        )
        self.depth_slice_labels = self._get_slice(
            width = self.dimensions['inline'],
            height = self.dimensions['crossline'],
            texture = self.labels[self.current_label][self.current_z_idx, :, :],
            index = self.current_z_idx,
            axis = "depth",
            **self.kwargs_label
        )
        self.current_slice = None

        self.data = [self.il_slice, self.xl_slice, self.depth_slice]
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, data, buffers):
        _type = data.pop("type")
        _data = data.pop("data")
        match (_type, _data):
            case "is-show-label", _:
                self.show_label = _data
                if self.show_label:
                    print(_type, _data)
                    if self.current_slice == "Inline":
                        self.il_slice_labels    = self._get_slice(
                            width = self.dimensions['crossline'],
                            height = self.dimensions['depth'],
                            texture = self.labels[self.current_label][:, self.current_il_idx, :],
                            index = self.current_il_idx,
                            axis = "inline",
                            **self.kwargs_label
                        )
                    elif self.current_slice == "Crossline":
                        self.xl_slice_labels = self._get_slice(
                            width = self.dimensions['inline'],
                            height = self.dimensions['depth'],
                            texture = self.labels[self.current_label][:, :, self.current_xl_idx],
                            index = self.current_xl_idx,
                            axis = "crossline",
                            **self.kwargs_label
                        )
                    elif self.current_slice == "Depth Slice":
                        self.depth_slice_labels = self._get_slice(
                            width = self.dimensions['inline'],
                            height = self.dimensions['crossline'],
                            texture = self.labels[self.current_label][self.current_z_idx, :, :],
                            index = self.current_z_idx,
                            axis = "depth",
                            **self.kwargs_label
                        )
                    else:
                        pass
            case "label-to-show", _:
                self.current_label = _data

            case "is-2d-view", _:
                self.is_2d_view = _data
            case "slice-to-show", "Inline":
                self.current_slice = _data
                self.il_slice      = self._get_slice(
                    width = self.dimensions['crossline'],
                    height = self.dimensions['depth'],
                    texture = self.data_source[:, self.current_il_idx, :],
                    index = self.current_il_idx,
                    axis = "inline",
                    alpha=1,
                    cmap="seismic"
                )
                if self.show_label:
                    self.il_slice_labels    = self._get_slice(
                        width = self.dimensions['crossline'],
                        height = self.dimensions['depth'],
                        texture = self.labels[self.current_label][:, self.current_il_idx, :],
                        index = self.current_il_idx,
                        axis = "inline",
                        **self.kwargs_label
                    )
            case "data-Inline", _:
                self.current_slice = "Inline"
                self.current_il_idx = _data
                self.il_slice       = self._get_slice(
                    width = self.dimensions['crossline'],
                    height = self.dimensions['depth'],
                    texture = self.data_source[:, self.current_il_idx, :],
                    index = self.current_il_idx,
                    axis = "inline",
                    alpha=1,
                    cmap="seismic"
                )
                if self.show_label:
                    self.il_slice_labels    = self._get_slice(
                        width = self.dimensions['crossline'],
                        height = self.dimensions['depth'],
                        texture = self.labels[self.current_label][:, self.current_il_idx, :],
                        index = self.current_il_idx,
                        axis = "inline",
                        **self.kwargs_label
                    )
            case "slice-to-show", "Crossline":
                self.current_slice = _data
                self.xl_slice       = self._get_slice(
                    width = self.dimensions['inline'],
                    height = self.dimensions['depth'],
                    texture = self.data_source[:, :, self.current_xl_idx],
                    index = self.current_xl_idx,
                    axis = "crossline",
                    alpha=1,
                    cmap="seismic"
                )
                if self.show_label:
                    self.xl_slice_labels    = self._get_slice(
                        width = self.dimensions['inline'],
                        height = self.dimensions['depth'],
                        texture = self.labels[self.current_label][:, :, self.current_xl_idx],
                        index = self.current_xl_idx,
                        axis = "crossline",
                        **self.kwargs_label
                    )
            case "data-Crossline", _:
                self.current_slice = "Crossline"
                self.current_xl_idx = _data
                self.xl_slice       = self._get_slice(
                    width = self.dimensions['inline'],
                    height = self.dimensions['depth'],
                    texture = self.data_source[:, :, self.current_xl_idx],
                    index = self.current_xl_idx,
                    axis = "crossline",
                    alpha=1,
                    cmap="seismic"
                )
                if self.show_label:
                    self.xl_slice_labels    = self._get_slice(
                        width = self.dimensions['inline'],
                        height = self.dimensions['depth'],
                        texture = self.labels[self.current_label][:, :, self.current_xl_idx],
                        index = self.current_xl_idx,
                        axis = "crossline",
                        **self.kwargs_label
                    )
            case "slice-to-show", "Depth Slice":
                self.current_slice = _data
                self.depth_slice = self._get_slice(
                    width = self.dimensions['inline'],
                    height = self.dimensions['crossline'],
                    texture = self.data_source[self.current_z_idx, :, :],
                    index = self.current_z_idx,
                    axis = "depth",
                    alpha=1,
                    cmap="seismic"
                )
                if self.show_label:
                    self.depth_slice_labels = self._get_slice(
                        width = self.dimensions['inline'],
                        height = self.dimensions['crossline'],
                        texture = self.labels[self.current_label][self.current_z_idx, :, :],
                        index = self.current_z_idx,
                        axis = "depth",
                        **self.kwargs_label
                    )
            case "data-Depth Slice", _:
                self.current_slice = "Depth Slice"
                self.current_z_idx = _data
                self.depth_slice = self._get_slice(
                    width = self.dimensions['inline'],
                    height = self.dimensions['crossline'],
                    texture = self.data_source[self.current_z_idx, :, :],
                    index = self.current_z_idx,
                    axis = "depth",
                    alpha=1,
                    cmap="seismic"
                )
                if self.show_label:
                    self.depth_slice_labels = self._get_slice(
                        width = self.dimensions['inline'],
                        height = self.dimensions['crossline'],
                        texture = self.labels[self.current_label][self.current_z_idx, :, :],
                        index = self.current_z_idx,
                        axis = "depth",
                        **self.kwargs_label
                    )

            case "label-to-select", _:
                self.kwargs_label = self.kwargs_labels[self.current_label]


            case (_, _):
                print(_type, _data)

        if self.is_2d_view:
            if self.current_slice == "Inline":
                self.data = [self.il_slice]
                if self.show_label:
                    self.data.append(self.il_slice_labels)
            elif self.current_slice == "Crossline":
                self.data = [self.xl_slice]
                if self.show_label:
                    self.data.append(self.xl_slice_labels)
            else:
                self.data = [self.depth_slice]
                if self.show_label:
                    self.data.append(self.depth_slice_labels)
        else:
            self.data = [self.il_slice, self.xl_slice, self.depth_slice]
            if self.show_label:
                self.data += [self.il_slice_labels, self.xl_slice_labels, self.depth_slice_labels]

        if self.show_label:
            self.send_state("current_label")
        self.send_state("data")

    def _normalize_data(self, data):
        """Normalize data to 0-1 range for texture rendering"""
        if data.dtype == np.bool_ or data.dtype == bool:
            return data.astype(np.float32)
        else:
            data_min = np.min(data)
            data_max = np.max(data)
            if data_max - data_min > 0:
                return (data - data_min) / (data_max - data_min)
            else:
                return np.zeros_like(data, dtype=np.float32)

    def _get_slice(self, height, width, texture, index, axis, alpha=1, cmap="gray"):
        # if axis == "crossline" or axis == "inline":
        #     texture = texture[:, ::-1].T
        # else:
        #     texture = texture.T
        # texture = texture.reshape(height+1, width+1)

        return {
            "height": width,
            "width" : height,
            "texture": texture.flatten(order="F").astype(np.float16).tolist(),
            "index": index,
            "span_through": axis, # xy
            "alpha":alpha,
            "cmap": cmap,
        }


__all__ = ["ScatterThreeWidget", "Plane3DThreeWidget",]
