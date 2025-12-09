import marimo

__generated_with = "0.18.3"
app = marimo.App(width="medium", sql_output="polars")


@app.cell
def _(area):
    area
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
            height=500
        )
    )
    return (area,)


@app.cell
def _():
    import marimo as mo
    import numpy as np
    from threey import Seismic3DViewer
    return Seismic3DViewer, mo, np


if __name__ == "__main__":
    app.run()
