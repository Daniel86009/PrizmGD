function AABB(ax, ay, aw, ah, bx, by, bw, bh) {
    return (
        ax < bx + bw &&
        ax + aw > bx &&
        ay < by + bh &&
        ay + ah > by
    );
}

function collide() {
    let pWX = Math.floor(playerX) + Math.floor(levelX);
    let pWY = Math.floor(playerY) + Math.floor(levelY);

    let oldPWX = pWX - scrollSpeed;
    let oldPWY = rGrav ? Math.floor(pWY + yVelocity) : Math.floor(pWY - yVelocity);

    let startCol = Math.floor(levelX) / tileSize;
    if (startCol < 0) startCol = 0;

    let endCol = startCol + 17;
    if (endCol > width) endCol = width;

    let jumpPad = false;

    for (let x = startCol; x < endCol; x++) {
        for (let y = 0; y < height; y++) {
            let mapIndex = y * width + x;
            let tileID = level[mapIndex];

            if (tileID <= 0) continue;

            let shape = collisions[tileID];
            if (shape.collisionType == 4) continue;

            let tileWX = x * tileSize + shape.x;
            let tileWY = y * tileSize + shape.y;

            if (AABB(pWX, pWY, playerSize, playerSize, tileWX, shape.width, shape.height)) {
                switch (shape.collisionType) {
                    case 1:
                        dead = true;
                        return;
                    case 2: case 5:
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            if (shape.collisionType == 2) canJumpOrb = true;
                        }
                }
            }
        }
    }
}