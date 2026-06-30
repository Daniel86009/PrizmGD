const playerSprite = new Image();
playerSprite.src = 'Sprites/GDIcon x24.png';

const gravity = 1.98 * 1.5;
let scrollSpeed = 5.8 * 1.5;
let ground = tileSize * 19;

let playerY = tileSize * 19;

let yVelocity = 0;
const jumpVel = -12.8 * 1.5;

const playerSize = 24;

let rGrav = false;

let isGrounded = false;
let pIsGrounded = false;
let canJumpOrb = false;
let canBlueJumpOrb = false;
let hasJumped = false;

let curOrbI = -1;
let lastOrbI = -1;

let dead = false;

let targetFPS = 20;
let lastFrameTime = performance.now();

let playerRot = 0;
let targetRot = 0;

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

            let tileWX = x * tileSize + shape.x;
            let tileWY = y * tileSize + shape.y + (20 - height) * tileSize;

            if (AABB(pWX, pWY, playerSize, playerSize, tileWX, tileWY, shape.width, shape.height)) {
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
                            //yVelocity = 0;//-jumpVel * 1.36;
              
                            if (!rGrav) {
                                playerY = tileWY + shape.height;
                                yVelocity = -jumpVel * 0.5;
                            } else {
                                playerY = tileWY - playerSize;
                                yVelocity = -jumpVel * 0.5;
                            }

                            pWY = Math.floor(playerY);
                            lastOrbI = curOrbI;
                            jumpPad = true;
                        }
                        continue;
                    case 7:
                        if (rGrav != false) {
                            rGrav = false;
                            yVelocity = -yVelocity;
                        }

                        continue;
                    case 8:
                        if (rGrav != true) {
                            rGrav = true;
                            yVelocity = -yVelocity;
                        }
                        continue;
                }

                if (shape.collisionType == 0) {
                    if (rGrav) {
                        //Reversed gravity
                        if (yVelocity >= 0 && (oldPWY + playerSize / 4) >= (tileWY + shape.height)) {
                            playerY = tileWY + playerSize;
                            yVelocity = 0.0;
                            isGrounded = true;
                            pWY = tileWY + shape.height;
                        } else if (yVelocity < 0 && (oldPWY + (playerSize - playerSize / 4)) <= tileWY) {
                            playerY = tileWY - playerSize;
                            yVelocity = 0.2;
                            pWY = tileWY - playerSize;
                        } else {
                            if (oldPWX + playerSize <= tileWX || oldPWX >= tileWX + shape.width) {
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
                        } else if (yVelocity <= 0 && (oldPWY + playerSize / 4) >= (tileWY + shape.height)) {
                            playerY = tileWY + shape.height;
                            yVelocity = 0.2;
                            pWY = tileWY + shape.height;
                        } else {
                            if (oldPWX + playerSize <= tileWX || oldPWX >= tileWX + shape.width) {
                                dead = true;
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    
    const worldGround = (20 * tileSize);
    if (Math.floor(playerY) + playerSize >= worldGround) {
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

    let spacePressed = false;
    for (let i = 0; i < pressedKeys.length; i++) {
        let key = pressedKeys[i];
        if (key == ' ') {
            spacePressed = true;
            if (canJumpOrb && !hasJumped) {
                yVelocity = jumpVel;
                lastOrbI = curOrbI;
                hasJumped = true;
            } else if (canBlueJumpOrb && !hasJumped) {
                rGrav = !rGrav;
                yVelocity = -jumpVel * 0.5;
                lastOrbI = curOrbI;
                hasJumped = true;
            } else if (isGrounded) {
                yVelocity = jumpVel;
                hasJumped = true;
            }
        }
    }
    if (!spacePressed) hasJumped = false;

    yVelocity += gravity;
    if (rGrav) playerY -= yVelocity;
    else playerY += yVelocity;

    isGrounded = false;
    canJumpOrb = false;
    canBlueJumpOrb = false;
    collide();

    if (isGrounded == false && pIsGrounded == false) {
        if (rGrav) targetRot -= 18;
        else targetRot += 18;
    } else {
        let r = rGrav ? 9 : 54;
        targetRot = Math.floor((playerRot + r) / 90) * 90;
    }
    targetRot = targetRot % 360;

    let diff = ((targetRot - playerRot + 540) % 360) - 180;

    if (Math.abs(diff) <= 18) {
        playerRot = targetRot;
    } else {
        playerRot += Math.sign(diff) * 18;
    }


    oldPlayerPos.push({x: levelX + playerX, y: playerY + (playerSize / 2)});
    
    if (playerY < -100) dead = true;

    if (dead) {
        stopTesting();
        return;
    }

    pIsGrounded = isGrounded;
}