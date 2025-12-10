# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "marimo",
#     "threey==0.0.12",
# ]
# ///

import marimo

__generated_with = "0.18.4"
app = marimo.App(width="columns", sql_output="polars")


@app.cell(column=0, hide_code=True)
def _(mo):
    mo.md("""
    # 3D Seismic Viewer Widget: `threey`

    ```bash
    pip install threey
    ```

    github page: [kelreeeeey/threey](https://github.com/kelreeeeey/threey)

    ---

    features:

    - [ ] view 3D seismic data
    - [ ] view any other 3D seismic attributes like fault cube, rgt, RMS, etc.
    - [ ] slicer through inline, crossline, and depth slice
    - [ ] also support 2D view, by passing flag `is_2d_view=True`
    - [ ] support matplotlib colormaps.
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""
    ## Load the data

    Are derived from Xinmung Wu et. al works, (2019) under title of "FaultSeg3D: using
    synthetic datasets to train an end-to-end convolutional neural network for 3D seismic
    fault segmentation"

    The full dataset can be found on https://github.com/xinwucwp/faultSeg/tree/master/data

    The example [seismic]("https://raw.githubusercontent.com/kelreeeeey/threey/main/example-data/seismic_cube_shape_128_128_128.csv")
    & [fault]("https://raw.githubusercontent.com/kelreeeeey/threey/main/example-data/fault_cube_shape_128_128_128.csv")
    that are being used here were loaded as csv and converted to NumPy array.
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""
    ## Actually using the widget

    The widget takes the `memoryview` of both of the data and labels (if exists).

    The widget expect that 3D data's axis have to be configured in this order

    - [ ] axis 0: vertical slice / z / xy-plane
    - [ ] axis 1 and 2: could be any of the vertical planes, xz-plane or yz-plane

    where `z` axis is perpendicular to the earth surface, _not_ to the computer screen :D

    > well, its up to the user if they want to change the order of the axis.


    The widget takes label in a form of dictionary, the label configuration like
    colormap and its alpha also expected to be in a form of dictionary with the same
    keys as the label dictionary.
    """)
    return


@app.cell
def _(mo, np):
    # load the data
    _dir = mo.notebook_dir() / "example-data"

    # the data's axis are configured to be in this order
    # axis 0: vertical slice / z / xy-plane
    # axis 1 and 2: could be any of the vertical planes, xz-plane or yz-plane
    # z axis is perpendicular to earth surface, not the computer screen :D
    synthetic_data = np.fromfile(_dir / "seismic_cube.dat", dtype=np.single).reshape((128,128,128)).transpose((2,0,1))
    synthetic_fault_data = np.fromfile(_dir / "fault_cube.dat", dtype=np.single).reshape((128,128,128)).transpose((2,0,1))
    return synthetic_data, synthetic_fault_data


@app.cell
def _(Seismic3DViewer, mo, synthetic_data, synthetic_fault_data):
    vmin, vmax = synthetic_data.min(), synthetic_data.max()

    # the widget takes memoryview of both the seismic data & the label
    sample_cube = memoryview(synthetic_data)
    sample_label = memoryview(synthetic_fault_data)

    labels = {"fault":sample_label}
    kwargs_labels = {"fault":dict(cmap="inferno", alpha=0.5)} # store the colormap and alpha for the label here!

    _dimensions = dict(
        inline=sample_cube.shape[1],
        crossline=sample_cube.shape[2],
        depth=sample_cube.shape[0]
    )

    area = mo.ui.anywidget(
        Seismic3DViewer(
            data_source = sample_cube,
            cmap_data = "seismic", # default to "seismic"
            dark_mode=False if mo.app_meta().theme != "dark" else True,
            labels=labels,
            kwargs_labels=kwargs_labels,
            show_label= False,
            vmin = vmin,
            vmax = vmax,
            is_2d_view = False, # default to True
            dimensions=_dimensions,
            height=750
        )
    )
    return (area,)


@app.cell
def _():
    import marimo as mo
    import numpy as np
    from threey import Seismic3DViewer
    return Seismic3DViewer, mo, np


@app.cell(column=1)
def _(area):
    area
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
