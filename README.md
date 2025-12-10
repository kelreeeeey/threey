# threey [![threey](https://molab.marimo.io/molab-shield.svg)](https://molab.marimo.io/notebooks/nb_efPXZi3JmiXTdpHzHdxm2b)

marimo App demo on [molab](https://molab.marimo.io/notebooks/nb_efPXZi3JmiXTdpHzHdxm2b/app)

github pages: [kelreeeey/marimo-gh-pages](https://kelreeeeey.github.io/marimo-gh-pages/)


## Installation

```sh
pip install threey
```

or with [uv](https://github.com/astral-sh/uv):

```sh
uv add threey
```

## Credits & Shout Out to

1. [Vincent](https://github.com/koaning) through His works on [mothree](https://github.com/koaning/mothree/)
2. [timothygebhard](https://github.com/timothygebhard/) through they work of [js-colormaps](https://github.com/timothygebhard/js-colormaps) for making the Matplotlib's colormap evaluator for JavaScript

## Features

- [ ] view 3D seismic data
- [ ] view any other 3D seismic attributes like fault cube, rgt, RMS, etc.
- [ ] slicer through inline, crossline, and depth slice
- [ ] also support 2D view, by passing flag `is_2d_view=True`
- [ ] support matplotlib colormaps.

# Usage

```python
from threey import Seismic3DViewer

# the data's axis are configured to be in this order
# axis 0: vertical slice / z / xy-plane
# axis 1 and 2: could be any of the vertical planes, xz-plane or yz-plane
# z axis is perpendicular to earth surface, not the computer screen :D
synthetic_data = np.load("path/to/3d_np_array.npy")
synthetic_fault_data = np.load("path/to/3d_np_array_label.npy")

vmin, vmax = synthetic_data.min(), synthetic_data.max()

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
        data_source = sample_cube, # this should be a memoryview of 3D np.ndarray
        cmap_data = "seismic", # default to "seismic"
        dark_mode=False if mo.app_meta().theme != "dark" else True,
        labels=labels, # this should be a dict, e.g. {"label1": memoryview(label1_3d_npy)}
        kwargs_labels=kwargs_labels, # this also should be a dict {"label1": dict(cmap='inferno', alpha=0.5)}
        show_label= False,
        vmin = vmin,
        vmax = vmax,
        is_2d_view = False, # default to True
        dimensions=_dimensions,
        height=500
    )
)
area

```
