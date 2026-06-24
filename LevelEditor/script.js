const c = document.getElementById('c');
const ctx = c.getContext('2d');

const output = document.getElementById('output');
const selectionInput = document.getElementById('selectionInput');

let level = [];
let mouse = {x: 0, y: 0, down: false, selection: 1};
let pressedKeys = [];
let width = 120;
let height = 10;

let levelX = 0;

let sTileSize = 24
let tileSize = sTileSize * 2;

let isTesting = false;

let lastKey = null;

let loaded = false;
const tileSheet = new Image();
tileSheet.src = 'Sprites/spritesheet x24.png';
tileSheet.onload = function() {loaded = true};

function drawTile(tileID, x, y) {
    const newTileID = tileID - 1;
    const tilesPerRow = 10;

    const sx = (newTileID % tilesPerRow) * sTileSize;
    const sy = Math.floor(newTileID / tilesPerRow) * sTileSize;

    ctx.drawImage(tileSheet, sx, sy, sTileSize, sTileSize, x, y, tileSize, tileSize);
}

function drawGrid(xOffset) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00000030';

    ctx.beginPath();

    let startX = -(xOffset % tileSize);
    for (let x = startX; x <= c.width; x += tileSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, c.height);
    }

    for (let y = 0; y <= c.height; y += tileSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(c.width, y);
    }

    ctx.stroke();
}

function drawLevel(xOffset) {
    let startCol = Math.floor(xOffset / tileSize);
    let endCol = Math.min(width, Math.ceil((xOffset + c.width) / tileSize));

    for (let x = startCol; x < endCol; x++) {
        for (let y = 0; y < height; y++) {
            let index = y * width + x;

            if (level[index] != 0) {
                let nx = (x * tileSize) - xOffset;
                drawTile(level[index], nx, y * tileSize);
            }
        }
    }
}

function newLevel() {
    width = parseInt(document.getElementById('width').value);
    height = parseInt(document.getElementById('height').value);

    c.width = document.body.clientWidth - 10;
    c.height = height * tileSize;

    level = [];
    for (let i = 0; i < width*height; i++) {
        level.push(0);
    }
}

function exportLevel() {
    let out = `const int level[${width * height}] = {\n`;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            out += level[y * width + x];
            if (x + y * width < width * height - 1) out += ',';
        }
        out += '\n';
    }

    out += '};';

    output.value = out;
}

function loadLevel() {
    const data = output.value;

    const size = parseInt(data.match(/\[(\d+)\]/)[1]);
    const dataString = data.match(/\{([\s\S]*?)\}/)[1];
    const array = dataString.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    const inputHeight = parseInt(document.getElementById('height').value);
    height = inputHeight;
    width = size / height;
    document.getElementById('width').value = width;

    level = array;
}

function changeSize() {
    const nWidth = parseInt(document.getElementById('width').value);
    const nHeight = parseInt(document.getElementById('height').value);

    let nLevel = [];
    
    const heightDiff = nHeight - height;

    for (let y = 0; y < nHeight; y++) {
        for (let x = 0; x < nWidth; x++) {
            let oldY = y - heightDiff;
            if (x < width && oldY >= 0 && oldY < height) {
                let oldIndex = oldY * width + x;
                nLevel.push(level[oldIndex]);
            } else {
                nLevel.push(0);
            }
        }
    }

    level = nLevel;
    width = nWidth;
    height = nHeight;
    
    c.height = height * tileSize;
}

function testLevel() {
    playerY = tileSize * (height - 1);
    yVelocity = 0;
    levelX = 0;
    isGrounded = false;
    rGrav = false;
    curOrbI = -1;
    lastOrbI = -1;
    dead = false;
    isTesting = true;
    oldPlayerPos = [];
}

function start() {
    c.addEventListener('mousedown', () => {
        mouse.down = true;
    });

    c.addEventListener('mouseup', () => {
        mouse.down = false;
    });

    document.addEventListener('mousemove', (event) => {
        let rect = c.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    });

    document.addEventListener('keydown', (event) => {
        let keyName = event.key;
        for (let i = 0; i < pressedKeys.length; i++) {
            if (pressedKeys[i] == keyName) {
                pressedKeys.splice(i, 1);
                i--;
            }
        }
        pressedKeys.push(keyName);
    });

    document.addEventListener('keyup', (event) => {
        let keyName = event.key;
        for (let i = 0; i < pressedKeys.length; i++) {
            if (pressedKeys[i] == keyName) {
                pressedKeys.splice(i, 1);
                i--;
            }
            if (lastKey == keyName) lastKey = null;
        }
    });

    selectionInput.addEventListener('change', () => {
        mouse.selection = selectionInput.value;
    });

    newLevel();
}

function update() {
    ctx.clearRect(0, 0, c.width, c.height);

    let gridX = Math.floor(mouse.x / tileSize);
    let gridY = Math.floor(mouse.y / tileSize);

    if (!isTesting) {
        if (mouse.down) {
            let index = (gridY * width + Math.round(gridX + levelX / tileSize));
            if (index < level.length) level[index] = mouse.selection;
        }

        for (let i = 0; i < pressedKeys.length; i++) { 
            let key = pressedKeys[i];
            if (!isNaN(Number(key))) mouse.selection = Number(key);
            if (key == 'ArrowUp' && key != lastKey) {
                mouse.selection = (mouse.selection + 1) % 40;
                lastKey = key;
            } else if (key == 'ArrowDown' && key != lastKey) {
                mouse.selection -= 1;
                if (mouse.selection < 0) mouse.selection = 39;
                lastKey = key;
            } else if (key == 'ArrowLeft') {
                levelX -= 24;
                if (levelX < 0) levelX = 0;
            } else if (key == 'ArrowRight') {
                levelX += 24;
                if (levelX > width * tileSize) levelX = width * tileSize;
            }
        }
    }
    
    if (loaded) drawLevel(levelX);
    drawGrid(levelX);

    if (isTesting) {
        updatePlayer();

        ctx.drawImage(playerSprite, playerX, playerY, tileSize, tileSize);
    } else {
        ctx.globalAlpha = 0.5;
        drawTile(mouse.selection, gridX * tileSize, gridY * tileSize);
        ctx.globalAlpha = 1;
    }

    if (oldPlayerPos[0]) {
        ctx.beginPath();
        ctx.strokeStyle = '#37ff00';
        ctx.lineWidth = 1;
        ctx.moveTo(playerX - levelX, ground);
        for (let i = 0; i < oldPlayerPos.length - 1; i++) {
            let pos = oldPlayerPos[i+1];
            ctx.lineTo(pos.x - levelX, pos.y);
        }
        ctx.stroke();
    }

    window.requestAnimationFrame(update);
}

function swap() {
    let temp = [];
    let swap = [
        0, 1, 2, 3, 4, 5, 6, 7, 13, 14, 15,
        16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 28, 27, 12, 35, 36, 37, 38, 39
    ];

    for (let i = 0; i < level.length; i++) {
        let n = level[i];

        n = swap[n];

        temp.push(n);
    }

    level = temp;
    exportLevel();
}

start();
window.requestAnimationFrame(update);