from typing import Final

__all__ = [
    "get_threey_fault_types",
    "FaultTypes"
    "FAULT_POINTS",
    "FAULT_LINES",
    "FAULT_SURFACE",
    "FAULT_POINTS_AND_LINE",
    "FAULT_POINTS_AND_SURFACE",
    "FAULT_ALL",
]

FaultTypes: Final[dict[int, str]] = {
    0: "POINTS",
    1: "LINES",
    2: "SURFACE",
    3: "POINTS_AND_LINE",
    4: "POINTS_AND_SURFACE",
    5: "LINES_AND_SURFACE",
    6: "ALL",
}

FAULT_POINTS:             Final[int] = FaultTypes[0]
FAULT_LINES:              Final[int] = FaultTypes[1]
FAULT_SURFACE:            Final[int] = FaultTypes[2]
FAULT_POINTS_AND_LINE:    Final[int] = FaultTypes[3]
FAULT_POINTS_AND_SURFACE: Final[int] = FaultTypes[4]
FAULT_LINES_AND_SURFACE:  Final[int] = FaultTypes[5]
FAULT_ALL:                Final[int] = FaultTypes[6]

def get_threey_fault_types(name: str) -> int:
    if name in FaultTypes:
        return FaultTypes[name]
    else:
        raise KeyError(f"{name} is no valid")
