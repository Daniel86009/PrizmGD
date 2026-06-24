const playerSprite = new Image();
playerSprite.src = 'Sprites/GDIcon x24.png';

const gravity = 1.98 * 1.5 * 2;
let scrollSpeed = 5.8 * 1.5 * 2;
let ground = tileSize * (height - 1);


let oldPlayerPos = [];
let playerX = 140;
let playerY = tileSize * (height - 1);

let yVelocity = 0;
const jumpVel = -12.8 * 1.5 * 2;

const playerSize = 48;

let rGrav = false;

let isGrounded = false;

let canJumpOrb = false;
let canBlueJumpOrb = false;

let curOrbI = -1;
let lastOrbI = -1;

let dead = false;

let targetFPS = 20;
let lastFrameTime = performance.now();

function AABB(ax, ay, aw, ah, bx, by, bw, bh) {
    return (
        ax < bx + bw &&
        ax + aw > bx &&
        ay < by + bh &&
        ay + ah > by
    );
}

function collide() {
    let pWX = Math.floor(playerX + levelX);
    let pWY = Math.floor(playerY);

    let oldPWX = pWX - Math.floor(scrollSpeed);
    let oldPWY = rGrav ? Math.floor(pWY + yVelocity) : Math.floor(pWY - yVelocity);

    let startCol = Math.floor(levelX / tileSize);
    if (startCol < 0) startCol = 0;

    let endCol = startCol + 17;
    if (endCol > width) endCol = width;

    let jumpPad = false;

    for (let x = startCol; x < endCol; x++) {
        for (let y = 0; y < height; y++) {
            let mapIndex = Math.floor(y * width + x);
            let tileID = level[mapIndex];

            if (tileID <= 0) continue;

            let shape = collisions[tileID - 1];
            if (shape.collisionType == 4) continue;

            let tileWX = x * tileSize + shape.x * 2;
            let tileWY = y * tileSize + shape.y * 2;

            if (AABB(pWX, pWY, playerSize, playerSize, tileWX, tileWY, shape.width * 2, shape.height * 2)) {
                switch (shape.collisionType) {
                    case 1:
                        dead = true;
                        return;
                    case 2: case 5:
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            if (shape.collisionType == 2) canJumpOrb = true;
                            else canBlueJumpOrb = true;
                        }
                        continue;
                    case 3:
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            playerY = tileWY - playerSize;

                            pWY = playerY - playerSize;

                            yVelocity = jumpVel * 1.36;

                            lastOrbI = curOrbI;
                            jumpPad = true;
                        }
                        continue;
                    case 6:
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            rGrav = !rGrav;
                            yVelocity = 0;//-jumpVel * 1.36;
              
                            if (!rGrav) {
                                playerY = tileWY + shape.height;
                            } else {
                                playerY = tileWY - playerSize;
                            }

                            pWY = Math.floor(playerY);
                            lastOrbI = curOrbI;
                            jumpPad = true;
                        }
                        continue;
                }

                if (shape.collisionType == 0) {
                    if (rGrav) {
                        //Reversed gravity
                        if (yVelocity >= 0 && (oldPWY + playerSize / 4) >= (tileWY + shape.height * 2)) {
                            playerY = tileWY + playerSize;
                            yVelocity = 0.0;
                            isGrounded = true;
                            pWY = tileWY + shape.height * 2;
                        } else if (yVelocity < 0 && (oldPWY + (playerSize - playerSize / 4)) <= tileWY) {
                            playerY = tileWY - playerSize;
                            yVelocity = 0.2;
                            pWY = tileWY - playerSize;
                        } else {
                            if (oldPWX + playerSize <= tileWX || oldPWX >= tileWX + shape.width * 2) {
                                dead = true;
                                return;
                            }
                        }
                    } else {
                        //Normal gravity
                        if (yVelocity >= 0 && (oldPWY + (playerSize - playerSize / 4)) <= tileWY) {
                            playerY = tileWY - playerSize;
                            yVelocity = 0;
                            isGrounded = true;
                            pWY = tileWY - playerSize;
                        } else if (yVelocity <= 0 && (oldPWY + playerSize / 4) >= (tileWY + shape.height * 2)) {
                            playerY = tileWY + shape.height * 2;
                            yVelocity = 0.2;
                            pWY = tileWY + shape.height * 2;
                        } else {
                            if (oldPWX + playerSize <= tileWX || oldPWX >= tileWX + shape.width * 2) {
                                dead = true;
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    let worldGround = (height * tileSize);
    if (Math.floor(playerY) + playerSize > worldGround) {
        playerY = worldGround - playerSize;
        if (jumpPad == false) yVelocity = 0;
        isGrounded = true;
    }
}

function updatePlayer() {
    const currentTime = performance.now();
    const elapsedTime = currentTime - lastFrameTime;
    if (elapsedTime < 1000 / targetFPS) {
        return;
    }
    lastFrameTime = currentTime - (elapsedTime % (1000 / targetFPS));

    levelX += scrollSpeed;

    for (let i = 0; i < pressedKeys.length; i++) {
        let key = pressedKeys[i];
        if (key == ' ') {
            if (canJumpOrb) {
                yVelocity = jumpVel; //* 1.1;
                lastOrbI = curOrbI;
            } else if (canBlueJumpOrb) {
                rGrav = !rGrav;
                yVelocity = -jumpVel * 0.5;//-jumpVel * 1.1;
                lastOrbI = curOrbI;
            } else if (isGrounded) {
                yVelocity = jumpVel;
            }
        }
    }

    yVelocity += gravity;
    if (rGrav) playerY -= yVelocity;
    else playerY += yVelocity;

    isGrounded = false;
    canJumpOrb = false;
    canBlueJumpOrb = false;
    collide();

    oldPlayerPos.push({x: levelX + playerX, y: playerY + 24});
    
    if (playerY < -100) dead = true;

    if (dead) {
        isTesting = false;
        return;
    }
}