const c = document.getElementById('c');
const ctx = c.getContext('2d');

const output = document.getElementById('output');
const selectionInput = document.getElementById('selectionInput');

let level = [];
let mouse = {x: 0, y: 0, down: false, selection: 1};
let width = 120;
let height = 10;

let levelX = 0;

let sTileSize = 24
let tileSize = sTileSize * 2;

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
    let startCol = xOffset / tileSize;
    //let endCol = Math.min(width, Math.ceil((xOffset + c.width) / tileSize));
    let endCol = Math.ceil(startCol + c.width / tileSize);

    if (endCol > width) endCol = width;

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

    document.addEventListener('keydown', (e) => {
        const tWidth = width * tileSize;
        if (!isNaN(Number(e.key))) mouse.selection = Number(e.key);
        if (e.key == 'ArrowUp') {
            mouse.selection = (mouse.selection + 1) % 30;
        } else if (e.key == 'ArrowDown') {
            mouse.selection -= 1;
            if (mouse.selection < 0) mouse.selection = 29;
        } else if (e.key == 'ArrowLeft') {
            levelX -= tileSize;
            if (levelX < 0) levelX = 0;
        } else if (e.key == 'ArrowRight') {
            levelX += tileSize;
            if (levelX > tWidth) levelX = tWidth;
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

    if (mouse.down) {
        let index = (gridY * width + Math.round(gridX + levelX / tileSize));
        if (index < level.length) level[index] = mouse.selection;
    }

    if (loaded) drawLevel(levelX);
    drawGrid(levelX);

    ctx.globalAlpha = 0.5;
    drawTile(mouse.selection, gridX * tileSize, gridY * tileSize);
    ctx.globalAlpha = 1;

    window.requestAnimationFrame(update);
}

start();
window.requestAnimationFrame(update);