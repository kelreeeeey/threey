import marimo

__generated_with = "0.18.1"
app = marimo.App(width="columns", sql_output="polars")


@app.cell(hide_code=True)
def _(mo, pathlib):
    select_dataset = mo.ui.dropdown(
        {
            "synthetic 1": r"E:\phr_kelrey\synthetic_dataset.zarr",
            "synthetic 2": "C:/Users/LediaPed/Documents/synthetic-mtl.zarr",
        } | {x.name:str(x) for x in pathlib.Path(r"C:\Users\LediaPed\Documents\data-struktur-phr-zarr").iterdir()},

        value="synthetic 1", label="Select Dataset")
    select_dataset.center()
    return (select_dataset,)


@app.cell(hide_code=True)
def _(mo, sample_index, syntheticdata_group):
    if "synthetic" in str(syntheticdata_group.store_path):
        mo.output.append(sample_index.center())
    return


@app.cell
def _(area):
    area
    return


@app.cell
def _(mo):
    use_dark_bg = mo.ui.switch(label="Switch Background", value=False)
    return


@app.cell
def _(mo):
    reset_planes = mo.ui.run_button(label="Reset views", kind="warn")
    return


@app.cell
def _():
    height: int = 1024
    return (height,)


@app.cell
def _(select_dataset, zarr):
    syntheticdata_group = zarr.open_consolidated(select_dataset.value)
    return (syntheticdata_group,)


@app.cell
def _(syntheticdata_group):
    list_keys = list(syntheticdata_group.keys())
    return (list_keys,)


@app.cell
def _(list_keys, sample_index, syntheticdata_group):
    if "seis" in list_keys:
        syntheticdata = syntheticdata_group['seis']
        sample_cube = syntheticdata[sample_index.value][:, :, :]
        vmin, vmax = sample_cube.min(), sample_cube.max()
    elif "raw" in list_keys:
        syntheticdata = syntheticdata_group['raw']
        vmin, vmax = syntheticdata.attrs['min'], syntheticdata.attrs['max'] 
        sample_cube = syntheticdata[10:700, :, :]

    labels = {}
    kwargs_labels = {}

    if 'fault' in list_keys and 'raw' in list_keys:
        faultdata = syntheticdata_group['fault']
        sample_fault = faultdata[10:700, :, :]
        labels["fault"] = sample_fault
        kwargs_labels['fault'] = dict(alpha=0.5, cmap="gray")

    if 'fault' in list_keys and 'raw' not in list_keys:
        faultdata = syntheticdata_group['fault']
        sample_fault = faultdata[sample_index.value][:, :, :]
        labels["fault"] = sample_fault
        kwargs_labels['fault'] = dict(alpha=0.5, cmap="gray")

    if "rgt" in list_keys:
        rgtdata = syntheticdata_group['rgt']
        sample_rgt = rgtdata[sample_index.value][:, :, :]
        labels["rgt"] = sample_rgt
        kwargs_labels['rgt'] = dict(alpha=0.75, cmap="jet")

    dimensions = dict(inline=sample_cube.shape[1], crossline=sample_cube.shape[2], depth=sample_cube.shape[0])
    return dimensions, kwargs_labels, labels, sample_cube, vmax, vmin


@app.cell
def _(
    Seismic3DViewer,
    dimensions,
    height: int,
    kwargs_labels,
    labels,
    mo,
    sample_cube,
    vmax,
    vmin,
):
    area = mo.ui.anywidget(
        Seismic3DViewer(
            data_source = sample_cube,
            dark_mode=False if mo.app_meta().theme != "dark" else True,
            labels=labels,
            kwargs_labels=kwargs_labels,
            show_label= False,
            vmin = vmin,
            vmax = vmax,
            is_2d_view = False,
            height=height,
            dimensions=dimensions
        )
    )
    return (area,)


@app.cell
def _(mo):
    sample_index = mo.ui.slider(start=0, step=2, stop=89, label="Sample Index", value=8, include_input=True)
    return (sample_index,)


@app.cell
def _():
    import marimo as mo
    import zarr
    import numpy as np
    import matplotlib.pyplot as plt
    import pathlib
    import sys
    sys.path.append("./src")
    import random
    from threey import Seismic3DViewer
    return Seismic3DViewer, mo, pathlib, zarr


if __name__ == "__main__":
    app.run()
