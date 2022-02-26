import Vec2 from "./vec2";

// Do two axis aligned bounding boxes overlap? Given by center position and extents.
export function isOverlapping2D(pos1: Vec2, extents1: Vec2, pos2: Vec2, extents2: Vec2) {
    return isOverlapping1D(pos1.x, extents1.x, pos2.x, extents2.x)
        && isOverlapping1D(pos1.y, extents1.y, pos2.y, extents2.y);
}

export function isOverlapping1D(pos1: number, extent1: number, pos2: number, extent2: number) {
    const min1 = pos1 - extent1;
    const max1 = pos1 + extent1;
    const min2 = pos2 - extent2;
    const max2 = pos2 + extent2;
    return !(min1 > max2 || max1 < min2)
}

export function calcImageGrid(canvasSize: Vec2, pos: Vec2, size: Vec2, zoomFactor: number) {
    const zoomedCanvas = canvasSize.scale(1 / zoomFactor);

    let rowsBefore = Math.ceil((zoomedCanvas.y - size.y) / 2 / size.y);
    let colsBefore = Math.ceil((zoomedCanvas.x - size.x) / 2 / size.x);
    let rowCount = 2 * rowsBefore + 1;
    let colCount = 2 * colsBefore + 1;
    let firstPos = new Vec2(pos.x - colsBefore * size.x, pos.y - rowsBefore * size.y);

    let firstXFlip = colsBefore % 2 !== 0;
    let firstYFlip = rowsBefore % 2 !== 0;

    return {
        firstPos: firstPos,
        firstXFlip: firstXFlip,
        firstYFlip: firstYFlip,
        rowCount: rowCount,
        colCount: colCount
    }
}