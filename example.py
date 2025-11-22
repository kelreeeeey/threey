import marimo

__generated_with = "0.17.8"
app = marimo.App(width="medium", sql_output="polars")


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _():
    import zarr
    return (zarr,)


@app.cell
def _():
    import numpy as np
    import anywidget
    import traitlets
    import pathlib
    return


@app.cell
def _():
    import sys
    sys.path.append("./src")
    import random
    return


@app.cell
def _(mo):
    widg = mo.watch.file("./src/threey/static/widget.js")
    return (widg,)


@app.cell(hide_code=True)
def _(widg):
    widg
    # class Plane3DThreeWidget(anywidget.AnyWidget):
    #     _esm = pathlib.Path("./src/threey/static/widget.js")
    #     _css = pathlib.Path("./src/threey/static/widget.css")

    #     # Data for the 3D chart
    #     kind = traitlets.Unicode().tag(sync=True)
    #     cmap = traitlets.Unicode().tag(sync=True)

    #     data = traitlets.List([]).tag(sync=True)
    #     data_source = None
    #     label_source = None
    #     label_list = traitlets.List([]).tag(sync=True)

    #     # dimensions = {width: int, height: int, depth: int}
    #     dimensions = traitlets.Dict().tag(sync=True)

    #     width = traitlets.Int().tag(sync=True)
    #     height = traitlets.Int().tag(sync=True)
    #     show_grid = traitlets.Bool(True).tag(sync=True)
    #     show_axes = traitlets.Bool(True).tag(sync=True)
    #     show_frame = traitlets.Bool(True).tag(sync=True)
    #     dark_mode = traitlets.Bool(True).tag(sync=True)

    #     # Communication traits for slice data
    #     data_slice_request = traitlets.Dict({}).tag(sync=True)
    #     data_slice_response = traitlets.Dict({}).tag(sync=True)
    #     label_slice_request = traitlets.Dict({}).tag(sync=True)
    #     label_slice_response = traitlets.Dict({}).tag(sync=True)

    #     def __init__(
    #         self,
    #         *args,  
    #         data_source=None,  # 3D numpy array
    #         label_source=None, # dict of 3D numpy arrays
    #         **kwargs,
    #     ):
    #         kwargs.update({"kind":"plane"})
    #         super(Plane3DThreeWidget, self).__init__(*args, **kwargs)

    #         self.data_source = data_source
    #         self.label_source = label_source
    #         self.label_list = list(label_source.keys())

    #         # Set dimensions from data_source if provided
    #         if data_source is not None and self.dimensions is not None:
    #             self.dimensions = {
    #                 "width": data_source.shape[0],
    #                 "height": data_source.shape[1], 
    #                 "depth": data_source.shape[2]
    #             }

    #         # Set up observers for slice requests
    #         self.observe(self._handle_data_slice_request, names=['data_slice_request'])
    #         self.observe(self._handle_label_slice_request, names=['label_slice_request'])

    #         return

    #     def _handle_data_slice_request(self, change):
    #         """Handle data slice requests from JavaScript"""
    #         request = change['new']
    #         if not request:
    #             return

    #         axis = request.get('axis', 'inline')
    #         slice_index = request.get('sliceIndex', 0)
    #         request_id = request.get('requestId', '')

    #         try:
    #             slice_data = self.get_data_slice(axis, slice_index)
    #             if slice_data is not None:
    #                 # Convert numpy array to list for JSON serialization
    #                 # Normalize data to 0-1 range for texture
    #                 normalized_data = self._normalize_data(slice_data)
    #                 data_list = normalized_data.flatten().tolist()

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

    #     def _handle_label_slice_request(self, change):
    #         """Handle label slice requests from JavaScript"""
    #         request = change['new']
    #         if not request:
    #             return

    #         axis = request.get('axis', 'inline')
    #         slice_index = request.get('sliceIndex', 0)
    #         label_index = request.get('labelIndex', 0)
    #         request_id = request.get('requestId', '')

    #         try:
    #             label_data = self.get_label_slice(axis, slice_index, label_index)
    #             if label_data is not None:
    #                 # Convert numpy array to list for JSON serialization
    #                 normalized_data = self._normalize_data(label_data)
    #                 data_list = normalized_data.flatten().tolist()

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

    #     def get_data_slice(self, axis, slice_index):
    #         """Get a 2D slice from the 3D data_source"""
    #         if self.data_source is None:
    #             return None

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

    #         return None

    #     def get_label_slice(self, axis, slice_index, label_index):
    #         """Get a 2D slice from the specified label in label_source"""
    #         if (self.label_source is None or 
    #             label_index >= len(self.label_source) or
    #             label_index < 0):
    #             return None

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

    #         return None

    from threey import Seismic3DViewer
    return (Seismic3DViewer,)


@app.cell
def _(mo):
    reset_planes = mo.ui.run_button(label="Reset views", kind="warn")
    return


@app.cell
def _(mo):
    use_dark_bg = mo.ui.switch(label="Switch Background", value=False)
    return


@app.cell
def _():
    width: int = 1400
    height: int = 600
    return


@app.cell
def _(zarr):
    syntheticdata_group_mtl = zarr.open_consolidated("C:/Users/LediaPed/Documents/synthetic-mtl.zarr")
    return (syntheticdata_group_mtl,)


@app.cell
def _(syntheticdata_group_mtl):
    sample_mtl = syntheticdata_group_mtl['seis'][0]
    return


@app.cell
def _(zarr):
    # syntheticdata_group = zarr.open_consolidated("C:/Users/LediaPed/Documents/synthetic-mtl.zarr")
    syntheticdata_group = zarr.open_consolidated(r"E:\phr_kelrey\synthetic_dataset.zarr")
    return (syntheticdata_group,)


@app.cell
def _():
    # list(syntheticdata_group.keys())
    return


@app.cell
def _(syntheticdata_group):
    syntheticdata = syntheticdata_group['seis']
    return (syntheticdata,)


@app.cell
def _(syntheticdata_group):
    faultdata = syntheticdata_group['fault']
    return (faultdata,)


@app.cell
def _(syntheticdata_group):
    rgtdata = syntheticdata_group['rgt']
    return (rgtdata,)


@app.cell
def _(Seismic3DViewer, mo, sample_cube, sample_fault, sample_rgt):
    area = mo.ui.anywidget(
        Seismic3DViewer(
            data_source = sample_cube,
            dark_mode=False,
            labels={"fault": sample_fault, "rgt": sample_rgt},
            kwargs_labels={"fault": dict(alpha=0.5, cmap="gray"), "rgt": dict(alpha=0.75, cmap="jet"),},
            show_label=False,
            is_2d_view = False,
            dimensions=dict(inline=sample_cube.shape[1]-1, crossline=sample_cube.shape[2]-1, depth=sample_cube.shape[0]-1)
        )
    )
    return (area,)


@app.cell
def _(mo):
    sample_index = mo.ui.slider(start=0, step=2, stop=89, label="Sample Index", value=42)
    return (sample_index,)


@app.cell
def _(faultdata, rgtdata, sample_index, syntheticdata):
    sample_cube = syntheticdata[sample_index.value]
    sample_fault = faultdata[sample_index.value]
    sample_rgt = rgtdata[sample_index.value]
    return sample_cube, sample_fault, sample_rgt


@app.cell(hide_code=True)
def _(sample_cube):
    vmin, vmax = sample_cube.min(), sample_cube.max()
    return vmax, vmin


@app.cell
def _(plt, sample_cube, vmax, vmin):
    plt.imshow(sample_cube[0], cmap="seismic", vmin=vmin, vmax=vmax)
    return


@app.cell
def _(plt, sample_cube, vmax, vmin):
    plt.imshow(sample_cube[:, -1], cmap="seismic", vmin=vmin, vmax=vmax)
    return


@app.cell
def _():
    import matplotlib.pyplot as plt
    return (plt,)


@app.cell
def _(sample_index):
    sample_index
    return


@app.cell
def _(area):
    area
    return


if __name__ == "__main__":
    app.run()
