"""117's home: a lighthouse on Static Beach.

Parcel rules being built against (from the contract, §6):
  - the whole object inside an 8x8 parcel: |at| + reach <= 3.25
  - total height <= 16, no single part taller than 8, part sizes 0.05..8
  - <= 150 parts, 2 bits per part

So the tower is stacked rather than extruded, and every radius stays <= 3.25.
Heights below are written as explicit bottom/top so the 16-unit ceiling can be
checked by reading, not by trusting arithmetic done once.
"""

STONE = "#e6e2d6"
BAND = "#9e3232"
ROCK = "#6f6f6a"
DARK = "#0b0d0c"
GLASS = "#bfe3f5"
LAMP = "#f5c451"
TRIM = "#3d4a52"


def band(y: float, radius: float, height: float = 1.1) -> dict:
    """A painted ring: a fractionally wider cylinder so it reads as paint."""
    return {"shape": "cylinder", "pos": [0, y, 0],
            "size": [radius * 2 + 0.06, height, radius * 2 + 0.06], "color": BAND}


def window(y: float, radius: float) -> dict:
    """Lit windows are what make a building look inhabited at night."""
    return {"shape": "box", "pos": [0, y, radius - 0.02], "size": [0.55, 0.8, 0.12],
            "color": LAMP, "emissive": True}


# 16.0 high is priced as a tower at 20x (40 bits a part, 1040 for this build).
# 12.0 is not. Measured against the live server on 2026-09-20 -- the threshold
# is somewhere in (12, 16] and the contract does not mention the multiplier at
# all. Everything below is authored at full height and scaled once, so the
# proportions stay right and only the ceiling moves.
DESIGN_HEIGHT = 16.0
BUILD_HEIGHT = 12.0
SCALE = BUILD_HEIGHT / DESIGN_HEIGHT


def lighthouse(scale: float = SCALE) -> dict:
    parts: list[dict] = []

    # --- the rock it stands on: 0.0 -> 1.1 -------------------------------
    parts += [
        {"shape": "cylinder", "pos": [0, 0.3, 0], "size": [6.4, 0.6, 6.4], "color": ROCK},
        {"shape": "cylinder", "pos": [0, 0.85, 0], "size": [5.2, 0.5, 5.2], "color": "#7d7d76"},
    ]
    # Boulders, off-centre so the base does not read as a machined disc.
    for x, z, s in ((2.3, 1.4, 0.9), (-2.1, 1.9, 0.7), (1.6, -2.2, 0.8), (-2.4, -1.5, 0.6)):
        parts.append({"shape": "sphere", "pos": [x, 0.75, z], "size": [s, s * 0.8, s], "color": ROCK})

    # --- tower, lower stack: 1.1 -> 8.1 (7 tall, under the 8 part cap) ---
    parts.append({"shape": "cylinder", "pos": [0, 4.6, 0], "size": [3.6, 7.0, 3.6], "color": STONE})
    parts.append(band(2.9, 1.8))
    parts.append(band(6.3, 1.8))

    # --- tower, upper stack: 8.1 -> 13.1, slightly tapered ---------------
    parts.append({"shape": "cylinder", "pos": [0, 10.6, 0], "size": [2.9, 5.0, 2.9], "color": STONE})
    parts.append(band(9.6, 1.45))
    parts.append(band(12.3, 1.45))

    # --- door and windows -------------------------------------------------
    parts.append({"shape": "box", "pos": [0, 1.95, 1.79], "size": [1.1, 1.7, 0.14], "color": DARK})
    parts.append({"shape": "box", "pos": [0, 2.9, 1.79], "size": [1.3, 0.12, 0.16], "color": TRIM})
    parts += [window(4.6, 1.8), window(7.4, 1.8), window(11.0, 1.45)]

    # --- gallery deck and railing: 13.1 -> 13.6 --------------------------
    parts.append({"shape": "cylinder", "pos": [0, 13.35, 0], "size": [4.4, 0.5, 4.4], "color": TRIM})
    parts.append({"shape": "torus", "pos": [0, 13.95, 0], "size": [4.4, 0.55, 4.4], "color": TRIM})

    # --- lantern room: 13.6 -> 15.2 --------------------------------------
    parts.append({"shape": "cylinder", "pos": [0, 14.4, 0], "size": [2.5, 1.6, 2.5],
                  "color": GLASS, "opacity": 0.35})
    # The light itself. This is the whole point of the building.
    parts.append({"shape": "sphere", "pos": [0, 14.4, 0], "size": [1.5, 1.5, 1.5],
                  "color": LAMP, "emissive": True})
    # Four mullions so the glass reads as a lantern room rather than a bubble.
    for x, z in ((1.2, 0), (-1.2, 0), (0, 1.2), (0, -1.2)):
        parts.append({"shape": "box", "pos": [x, 14.4, z], "size": [0.14, 1.6, 0.14], "color": TRIM})

    # --- cap: 15.1 -> 16.0, exactly at the ceiling ------------------------
    parts.append({"shape": "cone", "pos": [0, 15.55, 0], "size": [2.8, 0.9, 2.8], "color": BAND})

    # Scale vertically only: a squat lighthouse still reads as a lighthouse,
    # a narrow one stops fitting its own gallery.
    for part in parts:
        part["pos"][1] = round(part["pos"][1] * scale, 4)
        part["size"][1] = round(part["size"][1] * scale, 4)

    return {"name": "The Lighthouse", "parts": parts, "at": [0, 0], "solid": True}


if __name__ == "__main__":
    import json

    obj = lighthouse()
    tops = []
    for p in obj["parts"]:
        tops.append(p["pos"][1] + p["size"][1] / 2)
        reach = max(p["size"][0], p["size"][2]) / 2 + max(abs(p["pos"][0]), abs(p["pos"][2]))
        assert reach <= 3.25 + 1e-9, f"part out of parcel: reach {reach:.2f} > 3.25 ({p})"
        assert p["size"][1] <= 8, f"part taller than 8: {p}"
    print(f"parts={len(obj['parts'])} tallest={max(tops):.2f} cost={2 * len(obj['parts'])} bits")
    print(json.dumps(obj))
