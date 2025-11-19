import importlib.metadata
import pathlib

import anywidget
import traitlets

try:
    __version__ = importlib.metadata.version("threey")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"

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

class Plane3DThreeWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"

    # Data for the 3D chart
    kind = traitlets.Unicode().tag(sync=True)
    cmap = traitlets.Unicode().tag(sync=True)

    data = traitlets.List([]).tag(sync=True)

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


__all__ = ["ScatterThreeWidget", "Plane3DThreeWidget",]
