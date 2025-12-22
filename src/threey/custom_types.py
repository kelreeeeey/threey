from typing import Final

__all__ = [
    "get_threey_fault_types",
    "FaultTypes"
    "FAULT_POINTS",
    "FAULT_LINES",
    "FAULT_SURFACE",
]

FaultTypes: Final[dict[int, str]] = {
    0: "POINTS",
    1: "LINES",
    2: "SURFACE",
}

FAULT_POINTS:             Final[int] = FaultTypes[0]
FAULT_LINES:              Final[int] = FaultTypes[1]
FAULT_SURFACE:            Final[int] = FaultTypes[2]

def get_threey_fault_types(name: str) -> int:
    if name in FaultTypes:
        return FaultTypes[name]
    else:
        raise KeyError(f"{name} is no valid")
