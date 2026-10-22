const c = document.getElementById('c');
const ctx = c.getContext('2d');

const output = document.getElementById('output');
const stopButton = document.getElementById('stopButton');

const levelNameText = document.getElementById("levelNameText");

let level = [];
let mouse = {x: 0, y: 0, down: false, tileId: 1, tool: 'paint'};
let selection = {x: null, y: null, w: 0, h: 0, tiles: [], undo: []};
let pressedKeys = [];
let width = 120;
let height = 20;

let view = {showHitboxes: false, rotatePlayer: true, showTrail: true, showStartPos: true};

let levelX = 0;

let sTileSize = 24;
let tileSize = sTileSize;

let isTesting = false;

let lastKey = null;

let loaded = false;
const tileSheet = new Image();
tileSheet.src = 'Sprites/spritesheet x24 new.png';
tileSheet.onload = function() {loaded = true; populateTileSelect();};

let currentFileHandle = null;
let unsavedChanges = false;

let oldPlayerPos = [];

let undoStack = [];
let redoStack = [];

let startPos = {x: 0, y: 19};

let playerX = tileSize * 6;
let t = 0;
let diff = 0;

function drawTile(id, x, y) {
    const newTileID = id - 1;
    const tilesPerRow = 10;

    const sx = (newTileID % tilesPerRow) * sTileSize;
    const sy = Math.floor(newTileID / tilesPerRow) * sTileSize;

    ctx.beginPath();
    ctx.drawImage(tileSheet, sx, sy, sTileSize, sTileSize, x, y, tileSize, tileSize);
}

function drawGrid(xOffset) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00000030';

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
    let yOffset = (20 - height) * tileSize;

    for (let x = startCol; x < endCol; x++) {
        for (let y = 0; y < height; y++) {
            let index = y * width + x;
            let nx = (x * tileSize) - xOffset;
            if (level[index] != 0) {
                drawTile(level[index], nx, y * tileSize + yOffset);
            }

            if (selection.tiles.includes(index)) {
                ctx.fillStyle = '#37ff0083';
                ctx.fillRect(nx, y * tileSize + yOffset, tileSize, tileSize);
            }

            if (view.showHitboxes) {
                if (level[index] > 0) {
                    let shape = collisions[level[index] - 1];

                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    if (shape.collisionType > 2) {
                        ctx.strokeStyle = 'blue';
                        ctx.strokeRect(nx + shape.x, y * tileSize + yOffset + shape.y, shape.width, shape.height);
                        ctx.stroke();
                    } else if (shape.collisionType == 2) {
                        ctx.strokeStyle = 'red';
                        ctx.strokeRect(nx + shape.x, y * tileSize + yOffset + shape.y, shape.width, shape.height);
                        ctx.stroke();
                    }
                }
            }
        }
    }
}

function drawStartPos() {
    const sx = startPos.x * tileSize - levelX + playerX;
    const sy = startPos.y * tileSize;

    if (sx + tileSize < 0 || sx > c.width) return;

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('Start', sx, sy + (tileSize / 2));
    ctx.fillText('Pos', sx, sy + (tileSize / 2 + 6));
}

function setTile(index, newValue) {
    const oldValue = level[index];

    if (oldValue === newValue) return;

    undoStack.push({index, oldValue, newValue});

    redoStack.length = 0;

    level[index] = newValue;
    unsavedChanges = true;
}

function newLevel() {
    width = 1;
    height = 1;
    c.width = document.body.clientWidth - 2;

    level = [];
    for (let i = 0; i < width*height; i++) {
        level.push(0);
    }

    unsavedChanges = false;

    updateLevelInfo();
}

async function openLevel() {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            id: 'level-files',
            startIn: 'documents',
            types: [{
                description: 'Level Files',
                accept: {
                    'application/octet-stream': ['.lvl']
                }
            }]
        });

        currentFileHandle = fileHandle;

        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();

        loadLevelFromBuffer(buffer);
    } catch (err) {

    }
}

function loadLevelFromBuffer(buffer) {
    const view = new DataView(buffer);

    const MAX_NAME_LEN = 32;
    const headerSize = MAX_NAME_LEN + 12;

    let nameBytes = [];
    for (let i = 0; i < MAX_NAME_LEN; i++) {
        const charCode = view.getUint8(i);
        if (charCode === 0) break;
        nameBytes.push(String.fromCharCode(charCode));
    }

    const name = nameBytes.join('').trim();

    const ule = false; // Use big endian

    const nDiff = view.getInt32(32, ule);
    const w = view.getInt32(36, ule);
    const h = view.getInt32(40, ule);

    const layout = [];

    for (let i = 0; i < w * h; i++) {
        layout.push(view.getUint8(headerSize + i));
    }

    width = w;
    height = h;
    level = layout;
    undoStack = [];
    redoStack = [];

    levelNameText.textContent = name;
    
    unsavedChanges = false;
    selection.tiles = [];

    updateDiff(nDiff);

    changeSize();
    updateLevelInfo();
}

async function saveLevel() {
    if (!currentFileHandle) {
        saveLevelAs();
        return;
    }

    const buffer = createLevelBuffer(levelNameText.textContent, parseInt(diff), width, height, level);

    const writable = await currentFileHandle.createWritable();

    await writable.write(buffer);
    await writable.close();
    unsavedChanges = false;

    createPopup("Level Saved");
}

async function saveLevelAs() {
    const fileHandle = await window.showSaveFilePicker({
        id: 'level-files',
        startIn: 'documents',
        suggestedName: `${levelNameText.textContent}.lvl`,
        types: [{
            description: 'Level Files',
            accept: {
                'application/octet-stream': ['.lvl']
            }
        }]
    });

    currentFileHandle = fileHandle;

    await saveLevel();
}

function createLevelBuffer(name, diff, w, h, layout) {
    const MAX_NAME_LEN = 32;
    const headerSize = MAX_NAME_LEN + 12;

    const buffer = new ArrayBuffer(
        headerSize + layout.length
    );

    const view = new DataView(buffer);

    for (let i = 0; i < MAX_NAME_LEN; i++) {
        view.setUint8(
            i,
            i < name.length ? name.charCodeAt(i) : 0
        );
    }

    const ule = false;

    view.setInt32(32, diff, ule);
    view.setInt32(36, w, ule);
    view.setInt32(40, h, ule);

    for (let i = 0; i < layout.length; i++) {
        view.setUint8(headerSize + i, layout[i]);
    }

    return buffer;
}

function changeSize(nw = width, nh = height) {
    let nLevel = [];

    for (let y = 0; y < nh; y++) {
        for (let x = 0; x < nw; x++) {
            let oy = y - (nh - height);
            if (x < width && oy >= 0 && oy < height) {
                nLevel.push(level[oy * width + x]);
            } else {
                nLevel.push(0);
            }
        }
    }

    level = nLevel;
    width = nw;
    height = nh;

    updateLevelInfo();
}

function autoResize() {
    let positions = [];
    for (let i = 0; i < selection.tiles.length; i++) {
        positions.push({
            x: selection.tiles[i] % width,
            y: Math.floor(selection.tiles[i] / width)
        });
    }

    let maxX = -1;
    let minY = height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (level[y * width + x] !== 0) {
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
            }
        }
    }

    const nw = Math.max(1, maxX + 18);
    const nh = Math.min(20, minY < height ? height - minY : 1);
    if (nw !== width || nh !== height) {
        const yShift = nh - height;

        changeSize(nw, nh);

        selection.tiles = [];

        for (let i = 0; i < positions.length; i++) {
            selection.tiles.push((positions[i].y + yShift) * width + positions[i].x);
        }
    }
}

function testLevel() {
    playerY = startPos.y * tileSize;//tileSize * 19;
    playerRot = 0;
    targetRot = 0;
    yVelocity = 0;
    levelX = startPos.x * tileSize;
    isGrounded = false;
    rGrav = false;
    curOrbI = -1;
    lastOrbI = -1;
    dead = false;
    isTesting = true;
    oldPlayerPos = [];
    document.getElementById('pausePlayImg').src = 'Sprites/Stop.svg';
}

function stopTesting() {
    isTesting = false;
    document.getElementById('pausePlayImg').src = 'Sprites/Play.svg';
}

function playButton() {
    if (isTesting) stopTesting();
    else testLevel();
}

function updateLevelInfo() {
    document.getElementById('dimensions').innerHTML = `Width: ${width}, Height: ${height}`;
    document.getElementById('size').innerHTML = `Size: ${width * height}`;
}

function undo() {
    if (undoStack.length == 0) return;

    const action = undoStack.pop();

    redoStack.push(action);

    level[action.index] = action.oldValue;

    autoResize();
}

function redo() {
    if (redoStack.length == 0) return;

    const action = redoStack.pop();

    undoStack.push(action);

    level[action.index] = action.newValue;

    autoResize();
}

function select() {
    let minX = Math.floor((selection.x + levelX) / tileSize);
    let maxX = Math.ceil((selection.x + levelX + selection.w) / tileSize);
    let minY = Math.floor(selection.y / tileSize) - 20 + height;
    let maxY = Math.ceil((selection.y + selection.h) / tileSize) - 20 + height;

    if (minX > maxX) [minX, maxX] = [maxX, minX];
    if (minY > maxY) [minY, maxY] = [maxY, minY];

    for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
            let tile = y * width + x;
            if (selection.tiles.includes(tile)) selection.tiles = selection.tiles.filter((t) => t != tile);
            else if (level[tile] != undefined && level[tile] != 0) selection.tiles.push(tile);
        }
    }
}

function moveSelection(xAmount, yAmount) {
    selection.tiles.sort((a, b) => a - b);
    if (xAmount > 0 || yAmount > 0) selection.tiles = selection.tiles.toReversed();

    let types = [];
    let positions = [];
    let maxX = 0;
    let maxY = 0;

    for (let i = 0; i < selection.tiles.length; i++) {
        let tile = selection.tiles[i];

        let x = tile % width;
        let y = Math.floor(tile / width);

        positions.push({ x, y });
        types.push(level[tile]);

        let nx = x + xAmount;
        let ny = y + yAmount;

        if (nx > maxX) maxX = nx;
        if (ny > maxY) maxY = ny;
    }

    let nWidth = width;
    let nHeight = height;

    if (maxX + 18 > nWidth) {
        nWidth = maxX + 18;
    }
    let levelY = maxY - (20 - nHeight);
    if (levelY < 0) nHeight = Math.min(20, nHeight - levelY);

    let yShift = nHeight - height;
    if (nWidth != width || nHeight != height) {
        changeSize(nWidth, nHeight);

        for (let i = 0; i < positions.length; i++) {
            positions[i].y += yShift;
        }
    }

    for (let i = 0; i < positions.length; i++) {
        let p = positions[i];
        level[p.y * width + p.x] = 0;
    }

    selection.tiles = [];

    for (let i = 0; i < positions.length; i++) {
        let nx = positions[i].x + xAmount;
        let ny = positions[i].y + yAmount;

        let index = ny * width + nx;

        level[index] = types[i];
        selection.tiles.push(index);
    }

    unsavedChanges = true;

    autoResize();
}

function start() {
    c.addEventListener('mousedown', () => {
        mouse.down = true;
    });

    document.addEventListener('mouseup', () => {
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

        //Shortcuts
        if ((event.ctrlKey || event.metaKey)) {
            if (event.key.toLowerCase() == 's') {
                event.preventDefault();
                saveLevel();
            } else if (event.key.toLowerCase() == 'q') {
                event.preventDefault();
                testLevel();
            } else if (event.key.toLowerCase() == 'z') {
                event.preventDefault();
                undo();
            }
        }
        if (keyName == 'Escape') {
            stopTesting();
        } else if (keyName == 'w') {
            mouse.tool = 'paint';
            selection.tiles = [];
            lastKey = keyName;
        } else if (keyName == 'e') {
            mouse.tool = 'start';
            selection.tiles = [];
        } else if (keyName == 'r') {
            mouse.tool = 'select';
        } else if (keyName == 'Backspace' && selection.tiles.length > 0) {
            for (let i = 0; i < selection.tiles.length; i++) level[selection.tiles[i]] = 0;
            selection.tiles = [];
        }
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

    c.addEventListener('wheel', (event) => {
        event.preventDefault();

        levelX += event.deltaX;
        levelX += event.deltaY;
        if (levelX < 0) levelX = 0;
        //if (levelX > width * tileSize) levelX = width * tileSize;
    });

    window.addEventListener('beforeunload', (event) => {
        if (!unsavedChanges) return;

        event.preventDefault();
        event.returnValue = '';
    });

    window.addEventListener('resize', () => {
        c.width = document.body.clientWidth - 2;
    });

    c.height = 20 * tileSize;

    newLevel();
}

function update() {
    ctx.clearRect(0, 0, c.width, c.height);

    let gridX = Math.floor((mouse.x + levelX) / tileSize);
    let gridY = Math.floor(mouse.y / tileSize);

    if (!isTesting) {
        if (mouse.down) {
            if (mouse.tool == 'paint') {
                if (gridX + 18 > width) {
                    changeSize(gridX + 18, height);
                }

                let levelY = gridY - (20 - height);

                if (levelY < 0) {
                    changeSize(width, Math.min(20, height - levelY));
                    levelY = 0;
                }

                const index = levelY * width + gridX;

                if (level[index] != mouse.tileId) {
                    setTile(index, mouse.tileId);
                }
                autoResize();
            } else if (mouse.tool == 'start') {
                startPos.x = gridX - 6;
                startPos.y = gridY;
                mouse.down = false;
                mouse.tool = 'paint';
            } else if (mouse.tool == 'select') {
                if (!selection.x) {
                    selection.x = mouse.x;
                    selection.y = mouse.y;
                } else {
                    selection.w = mouse.x - selection.x;
                    selection.h = mouse.y - selection.y;
                }
            }
        } else {
            if (selection.x) {
                select();
            }
            selection.x = null;
            selection.y = null;
            selection.w = 0;
            selection.h = 0;
        }

        for (let i = 0; i < pressedKeys.length; i++) { 
            let key = pressedKeys[i];
            if (mouse.tool != 'select' && selection.tiles.length <= 0) {
                if (!isNaN(Number(key))) mouse.tileId = Number(key);
                if (key == 'ArrowUp' && key != lastKey) {
                    mouse.tileId = (mouse.tileId + 1) % 49;
                    lastKey = key;
                } else if (key == 'ArrowDown' && key != lastKey) {
                    mouse.tileId -= 1;
                    if (mouse.tileId < 0) mouse.tileId = 48;
                    lastKey = key;
                } else if (key == 'ArrowLeft') {
                    levelX -= 24;
                    if (levelX < 0) levelX = 0;
                } else if (key == 'ArrowRight') {
                    levelX += 24;
                    //if (levelX > width * tileSize) levelX = width * tileSize;
                }
            } else {
                if (key == 'ArrowUp' && key != lastKey) {
                    moveSelection(0, -1);
                    lastKey = key;
                } else if (key == 'ArrowDown' && key != lastKey) {
                    moveSelection(0, 1);
                    lastKey = key;
                } else if (key == 'ArrowLeft' && key != lastKey) {
                    moveSelection(-1, 0);
                    lastKey = key;
                } else if (key == 'ArrowRight' && key != lastKey) {
                    moveSelection(1, 0);
                    lastKey = key;
                }
            }
        }
    }
    
    if (loaded) drawLevel(levelX);
    drawGrid(levelX);
    if (view.showStartPos) drawStartPos();

    if (isTesting) {
        updatePlayer();

        if (view.rotatePlayer) {
            ctx.translate(playerX + tileSize / 2, playerY + tileSize / 2);
            ctx.rotate(playerRot * Math.PI / 180);
            ctx.translate(-(playerX + tileSize / 2), -(playerY + tileSize / 2));
        }
        ctx.drawImage(playerSprite, playerX, playerY, tileSize, tileSize);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
        ctx.globalAlpha = 0.5;
        if (mouse.tool == 'paint') drawTile(mouse.tileId, gridX * tileSize - levelX, gridY * tileSize);
        else if (mouse.tool == 'start') {
            ctx.font = '10px sans-serif'
            ctx.fillText('Start', gridX * tileSize - levelX, gridY * tileSize + (tileSize / 2));
            ctx.fillText('Pos', gridX * tileSize - levelX, gridY * tileSize + (tileSize / 2 + 6));
        }
        ctx.globalAlpha = 1;
    }

    if (view.showTrail && oldPlayerPos[0]) {
        ctx.beginPath();
        ctx.strokeStyle = '#37ff00';
        ctx.lineWidth = 1;
        ctx.moveTo(startPos.x * tileSize - levelX + playerX, startPos.y * tileSize);
        for (let i = 0; i < oldPlayerPos.length - 1; i++) {
            let pos = oldPlayerPos[i+1];
            ctx.lineTo(pos.x - levelX, pos.y);
        }
        ctx.stroke();
    }

    if (selection.x && selection.y) {
        ctx.beginPath();
        ctx.strokeStyle = '#37ff00';
        ctx.lineWidth = 1;
        ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
    }

    window.requestAnimationFrame(update);
}

function swapTiles() {
    let temp = [];
    let swap = [
         0,  1,  2,  3,  4,  5,  6,  7,  8, 15,
        16, 17, 20, 21, 22, 23, 24, 25, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
        49
    ];

    for (let i = 0; i < level.length; i++) {
        let n = level[i];

        n = swap[n];

        temp.push(n);
    }

    level = temp;
}

function startEditing() {
    const container = document.querySelector(".editableText");
    const input = document.getElementById("levelNameInput");

    container.classList.add("editing");

    input.focus();
    input.select();
}

function stopEditing() {
    const container = document.querySelector(".editableText");
    const input = document.getElementById("levelNameInput");

    levelNameText.textContent = input.value;

    container.classList.remove("editing");
}

function updateDiff(nDiff) {
    const curDiff = document.getElementById('curDiff');

    curDiff.src = `Sprites/diffIcon0${nDiff+1}.png`;
    diff = nDiff;
}

function changeView(type) {
    let elem = null;
    switch (type) {
        case 0:
            elem = document.getElementById('showHitboxes');
            if (view.showHitboxes) {
                view.showHitboxes = false;
                elem.innerHTML = 'Show Hitboxes';
            } else {
                view.showHitboxes = true;
                elem.innerHTML = 'Hide Hitboxes';
            }
            break;
        case 1:
            elem = document.getElementById('rotatePlayer');
            if (view.rotatePlayer) {
                view.rotatePlayer = false;
                elem.innerHTML = 'Show Player Rot';
            } else {
                view.rotatePlayer = true;
                elem.innerHTML = 'Hide Player Rot';
            }
            break;
        case 2:
            elem = document.getElementById('showTrail');
            if (view.showTrail) {
                view.showTrail = false;
                elem.innerHTML = 'Show Trail';
            } else {
                view.showTrail = true;
                elem.innerHTML = 'Hide Trail';
            }
            break;
        case 3:
            elem = document.getElementById('showStartPos');
            if (view.showStartPos) {
                view.showStartPos = false;
                elem.innerHTML = 'Show Start Pos';
            } else {
                view.showStartPos = true;
                elem.innerHTML = 'Hide Start Pos';
            }
            break;
    }
}

start();
window.requestAnimationFrame(update);
