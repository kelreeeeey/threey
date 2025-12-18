from typing import Final

__all__ = [
    "get_threey_fault_types",
    "FaultTypes"
]

FaultTypes: Final[dict[str, int]] = {
    "POINTS":             0,
    "LINES":              1,
    "SURFACE":            2,
    "POINTS_AND_LINE":    3,
    "POINTS_AND_SURFACE": 4,
    "LINES_AND_SURFACE":  5,
    "ALL":                6,
}

def get_threey_fault_types(name: str) -> int:
    if name in FaultTypes:
        return FaultTypes[name]
    else:
        raise KeyError(f"{name} is no valid")
