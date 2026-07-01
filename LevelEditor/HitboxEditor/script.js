const c = document.getElementById('c');
const ctx = c.getContext('2d');

const output = document.getElementById('output');

const xIn = document.getElementById('xIn');
const yIn = document.getElementById('yIn');
const wIn = document.getElementById('wIn');
const hIn = document.getElementById('hIn');

let selectedTile = 1;
let mouse = {x: 0, y: 0, down: false};

let tileSize = 24;
let scale = 10;

let x = 0, y = 0, w = 24, h = 24;

let draggingCorner = null;

const tileSheet = new Image();
tileSheet.src = '../Sprites/spritesheet x24 new.png';
tileSheet.onload = function() {update()};

function drawTile(tileID, x, y) {
    const newTileID = tileID - 1;
    const tilesPerRow = 10;

    const sx = (newTileID % tilesPerRow) * tileSize;
    const sy = Math.floor(newTileID / tilesPerRow) * tileSize;

    ctx.drawImage(tileSheet, sx, sy, tileSize, tileSize, x, y, tileSize * scale, tileSize * scale);
}

function getCorners() {
    return {
        TL: { cx: x * scale, cy: y * scale },
        TR: { cx: (x + w) * scale, cy: y * scale },
        BL: { cx: x * scale, cy: (y + h) * scale },
        BR: { cx: (x + w) * scale, cy: (y + h) * scale }
    };
}

function start() {
    c.width = tileSize * 10;
    c.height = tileSize * 10;

    xIn.addEventListener('change', function(){updateInputs();});
    yIn.addEventListener('change', function(){updateInputs();});
    wIn.addEventListener('change', function(){updateInputs();});
    hIn.addEventListener('change', function(){updateInputs();});

    c.addEventListener('mousedown', () => {
        mouse.down = true;
        const corners = getCorners();
        
        for (const [cornerId, pos] of Object.entries(corners)) {
            const dist = Math.hypot(mouse.x - pos.cx, mouse.y - pos.cy);
            if (dist <= 8) {
                draggingCorner = cornerId;
                break;
            }
        }
    });

    c.addEventListener('mouseup', () => {
        mouse.down = false;
        draggingCorner = null;
    });

    document.addEventListener('mousemove', (event) => {
        let rect = c.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;

        if (mouse.down && draggingCorner) {
            let snapX = Math.round(mouse.x / scale);
            let snapY = Math.round(mouse.y / scale);

            let right = x + w;
            let bottom = y + h;

            if (draggingCorner === 'TL') {
                x = Math.min(snapX, right - 1);
                y = Math.min(snapY, bottom - 1);
                w = right - x;
                h = bottom - y;
            } else if (draggingCorner === 'TR') {
                right = Math.max(snapX, x + 1);
                y = Math.min(snapY, bottom - 1);
                w = right - x;
                h = bottom - y;
            } else if (draggingCorner === 'BL') {
                x = Math.min(snapX, right - 1);
                bottom = Math.max(snapY, y + 1);
                w = right - x;
                h = bottom - y;
            } else if (draggingCorner === 'BR') {
                right = Math.max(snapX, x + 1);
                bottom = Math.max(snapY, y + 1);
                w = right - x;
                h = bottom - y;
            }
            update();
        }
    });

    ctx.imageSmoothingEnabled = false;
}

function updateInputs() {
    x = xIn.value, y = yIn.value, w = wIn.value, h = hIn.value;
    update();
}

function update() {
    ctx.clearRect(0, 0, c.width, c.height);

    drawTile(selectedTile, 0, 0);

    xIn.value = x, yIn.value = y, wIn.value = w, hIn.value = h;

    ctx.fillStyle = '#ff000048';
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.fillRect(x * 10, y * 10, w * 10, h * 10);
    ctx.strokeRect(x * 10, y * 10, w * 10, h * 10);

    output.innerHTML = `{${x}, ${y}, ${w}, ${h}, 1}`;
}

start();