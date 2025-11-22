import marimo

__generated_with = "0.18.0"
app = marimo.App(width="full", sql_output="polars")


@app.cell
def _(area):
    area
    return


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
    return


@app.cell
def _():
    # sample_mtl = syntheticdata_group_mtl['seis'][0][:, :, :]
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
def _(faultdata, rgtdata, sample_index, syntheticdata):
    sample_cube = syntheticdata[sample_index.value][:, :, :]
    sample_fault = faultdata[sample_index.value][:, :, :]
    sample_rgt = rgtdata[sample_index.value][:, :, :]
    return sample_cube, sample_fault, sample_rgt


@app.cell
def _(Seismic3DViewer, mo, sample_cube, sample_fault, sample_rgt):
    area = mo.ui.anywidget(
        Seismic3DViewer(
            data_source = sample_cube,
            dark_mode=False,
            labels={"fault": sample_fault, "rgt": sample_rgt},
            kwargs_labels={"fault": dict(alpha=0.5, cmap="gray"), "rgt": dict(alpha=0.75, cmap="jet"),},
            show_label=False,
            is_2d_view = True,
            width=width,
            height=height,
            dimensions=dict(inline=sample_cube.shape[1], crossline=sample_cube.shape[2], depth=sample_cube.shape[0])
        )
    )
    return (area,)


@app.cell
def _(mo):
    sample_index = mo.ui.slider(start=0, step=2, stop=89, label="Sample Index", value=8, include_input=True)
    return (sample_index,)


@app.cell(hide_code=True)
def _(sample_cube):
    vmin, vmax = sample_cube.min(), sample_cube.max()
    return


@app.cell
def _():
    # a = sample_cube[-1].flatten("C").tolist()
    # plt.imshow(np.array(a).reshape(256, 256), cmap="seismic", vmin=vmin, vmax=vmax)
    return


@app.cell
def _():
    # plt.imshow(sample_cube[-1], cmap="seismic", vmin=vmin, vmax=vmax)
    # plt.imshow(sample_fault[-1], cmap="gray", alpha=0.5)
    return


@app.cell
def _():
    # import matplotlib.pyplot as plt
    return


@app.cell
def _(sample_index):
    sample_index.center()
    return


if __name__ == "__main__":
    app.run()
