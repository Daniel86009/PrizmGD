const playerSprite = new Image();
playerSprite.src = 'Sprites/GDIcon x24.png';

const gravity = 94.04 * tileSize;
let scrollSpeed = 10.386 * tileSize;
let ground = tileSize * 19;

let playerY = tileSize * 19;
let yVelocity = 0;
// const jumpVel = -20.375510 * tileSize;
const jumpVel = -19.8 * tileSize;
const terminalVel = 26.28 * tileSize;

const playerSize = 24;

let rGrav = false;

let isGrounded = false;
let pIsGrounded = false;
//Yellow, Pink, Red, Blue, Green, Black
let canJumpOrb = [false, false, false, false, false, false];
let hasJumped = false;

let curOrbI = -1;
let lastOrbI = -1;

let dead = false;

let targetFPS = 20;
const referenceFps = 20;
let lastFrameTime = performance.now();

let playerRot = 0;
let targetRot = 0;

let ox = levelX;
let oy = playerY;

let gameSpeed = 0.8;

//10.386 tiles/s
//94.04 units/s/s
//20.37 units/s
//Jump distance: 3.6 tiles
//Jump duration: 0.45s
//
//Red hitboxes act as if playerSize is 25
//Blue hitboxes act as if playerSize is 7.5

function AABB(ax, ay, aw, ah, bx, by, bw, bh) {
    return (
        ax < bx + bw &&
        ax + aw > bx &&
        ay < by + bh &&
        ay + ah > by
    );
}

function wallCollide(shape, pWY, oldPWX, oldPWY, tileWX, tileWY) {
    const hitboxSize = playerSize * 0.3;
    const hitboxOffset = (playerSize - hitboxSize) / 2;

    const hitboxX = oldPWX + hitboxOffset;
    const hitboxY = oldPWY + hitboxOffset;

    if (rGrav) {
        // if (yVelocity >= 0 && (hitboxY + hitboxSize / 4) >= (tileWY + shape.height)) {
        if (yVelocity >= 0 && (oldPWY + playerSize / 4) >= (tileWY + shape.height)) {
            playerY = tileWY + playerSize;
            yVelocity = 0;
            isGrounded = true;
        } else if (yVelocity < 0 && (hitboxY + (hitboxSize - hitboxSize / 4)) <= tileWY) {
            playerY = tileWY - playerSize;
            yVelocity = 0.2;
        } else {
            const overlapsX = hitboxX + hitboxSize > tileWX && hitboxX < tileWX + shape.width;
            const overlapsY = hitboxY + hitboxSize > tileWY && hitboxY < tileWY + shape.height;

            if (overlapsX && overlapsY) {
                dead = true;
                return;
            }
        }
    } else {
        // if (yVelocity >= 0 && (hitboxY + (hitboxSize - hitboxSize / 4)) <= tileWY) { 
        if (yVelocity >= 0 && (oldPWY + (playerSize - playerSize / 4)) <= tileWY) {
            playerY = tileWY - playerSize;
            yVelocity = 0;
            isGrounded = true;
            console.log("block collide");
        } else if (yVelocity <= 0 && (hitboxY + hitboxSize / 4) >= (tileWY + shape.height)) {
            playerY = tileWY + shape.height;
            yVelocity = 0.2;
        } else {
            const overlapsX = hitboxX + hitboxSize > tileWX && hitboxX < tileWX + shape.width;
            const overlapsY = hitboxY + hitboxSize > tileWY && hitboxY < tileWY + shape.height;

            if (overlapsX && overlapsY) {
                dead = true;
                return;
            }
        }
    }
}

function collide() {
    let pWX = Math.floor(playerX + levelX);
    let pWY = Math.floor(playerY);

    let oldPWX = playerX + ox;
    let oldPWY = oy;

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
            if (shape.collisionType == 0) continue;

            let tileWX = x * tileSize + shape.x;
            let tileWY = y * tileSize + shape.y + (20 - height) * tileSize;

            if (AABB(pWX, pWY, playerSize, playerSize, tileWX, tileWY, shape.width, shape.height)) {
                switch (shape.collisionType) {
                    case 2: //Spike
                        dead = true;
                        return;
                    case 3: case 5: case 7: case 9: case 11: case 12: //Orbs
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            switch (shape.collisionType) {
                                case 3: canJumpOrb[0] = true; break;
                                case 5: canJumpOrb[1] = true; break;
                                case 7: canJumpOrb[2] = true; break;
                                case 9: canJumpOrb[3] = true; break;
                                case 11: canJumpOrb[4] = true; break;
                                case 12: canJumpOrb[5] = true; break;
                            }
                        }
                        continue;
                    case 4: //Yellow Pad
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            playerY = tileWY - playerSize;

                            pWY = playerY - playerSize;

                            yVelocity = jumpVel * 1.47;

                            lastOrbI = curOrbI;
                            jumpPad = true;
                        }
                        continue;
                    case 6: //Pink Pad
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            playerY = tileWY - playerSize;

                            pWY = playerY - playerSize;

                            yVelocity = jumpVel * 0.63;

                            lastOrbI = curOrbI;
                            jumpPad = true;
                        }
                        continue;
                    case 8: //Red Pad
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            playerY = tileWY - playerSize;

                            pWY = playerY - playerSize;

                            yVelocity = jumpVel * 2.3;

                            lastOrbI = curOrbI;
                            jumpPad = true;
                        }
                        continue;
                    case 10: //Blue Pad
                        curOrbI = mapIndex;
                        if (lastOrbI != curOrbI) {
                            rGrav = !rGrav;
              
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
                    case 13: //Blue Portal
                        if (rGrav != false) {
                            rGrav = false;
                            yVelocity = -yVelocity;
                        }
                        continue;
                    case 14: //Yellow Portal
                        if (rGrav != true) {
                            rGrav = true;
                            yVelocity = -yVelocity;
                        }
                        continue;
                }

                if (shape.collisionType == 1) {
                   wallCollide(shape, pWY, oldPWX, oldPWY, tileWX, tileWY); 
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

function checkJumpOrb() {
    if (hasJumped) return true;
    
    if (canJumpOrb[0]) {
        yVelocity = jumpVel;
        lastOrbI = curOrbI;
        hasJumped = true;
        return false;
    } else if (canJumpOrb[1]) {
        yVelocity = jumpVel * 0.72;
        lastOrbI = curOrbI;
        hasJumped = true;
        return false;
    } else if (canJumpOrb[2]) {
        yVelocity = jumpVel * 1.28;
        lastOrbI = curOrbI;
        hasJumped = true;
        return false;
    } else if (canJumpOrb[3]) {
        rGrav = !rGrav;
        yVelocity = -jumpVel * 0.5;
        lastOrbI = curOrbI;
        hasJumped = true;
        return false;
    } else if (canJumpOrb[4]) {
        rGrav = !rGrav;
        yVelocity = jumpVel;
        lastOrbI = curOrbI;
        hasJumped = true;
        return false;
    } else if (canJumpOrb[5]) {
        yVelocity = -jumpVel;
        lastOrbI = curOrbI;
        hasJumped = true;
        return false;
    }

    return true;
}

function updatePlayer() { 
    const now = performance.now();
    let dt = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    dt *= gameSpeed;

    let spacePressed = false;
    for (let i = 0; i < pressedKeys.length; i++) {
        let key = pressedKeys[i];
        if (key == ' ') {
            spacePressed = true;
        }
    }
    if (!spacePressed) hasJumped = false;

    physUpdate(spacePressed, dt); 

    //Rotation
    if (isGrounded == false && pIsGrounded == false) {
        if (rGrav) targetRot -= 18 * dt * 20;
        else targetRot += 18 * dt * 20;
    } else {
        let r = rGrav ? 9 : 54;
        targetRot = Math.floor((playerRot + r) / 90) * 90;
    }
    targetRot = targetRot % 360;

    let diff = ((targetRot - playerRot + 540) % 360) - 180; 

    if (Math.abs(diff) <= 18) {
        playerRot = targetRot;
    } else {
        playerRot += Math.sign(diff) * 18 * dt * 20;
    }

    //Trail
    oldPlayerPos.push({x: levelX + playerX, y: playerY + (playerSize / 2)});
    
    //Kill Player if off top of screen
    if (playerY < -100) dead = true; 

    console.log("Grounded: " + isGrounded, "pGrounded: " + pIsGrounded);
    pIsGrounded = isGrounded;
}

function physUpdate(spacePressed, dt) {
    ox = levelX;
    oy = playerY;

    levelX += scrollSpeed * dt;

    if (spacePressed && checkJumpOrb() && isGrounded) {
        yVelocity = jumpVel;
        hasJumped = true;
    }
 
    const dir = rGrav ? -1 : 1; 
    const dy = dir * (yVelocity * dt + 0.5 * gravity * dt * dt);

    playerY += dy;
    yVelocity += gravity * dt;

    yVelocity = Math.min(yVelocity, terminalVel);

    isGrounded = false;
    for (let i = 0; i < canJumpOrb.length; i++) canJumpOrb[i] = false;
    collide(); 

    if (dead) {
        stopTesting();
        return;
    } 
}
