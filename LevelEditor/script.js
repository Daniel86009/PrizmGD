const c = document.getElementById('c');
const ctx = c.getContext('2d');

const output = document.getElementById('output');
const stopButton = document.getElementById('stopButton');

const levelNameText = document.getElementById("levelNameText");

let level = [];
let mouse = {x: 0, y: 0, down: false, tileId: 1, tool: 'paint'};
let pressedKeys = [];
let width = 120;
let height = 20;

let view = {showHitboxes: false, rotatePlayer: true, showTrail: true, showStartPos: true};

let levelX = 0;

let sTileSize = 24
let tileSize = sTileSize;

let isTesting = false;

let lastKey = null;

let loaded = false;
const tileSheet = new Image();
tileSheet.src = 'Sprites/spritesheet x24.png';
tileSheet.onload = function() {loaded = true};

let currentFileHandle = null;
let unsavedChanges = false;

let oldPlayerPos = [];

let undoStack = [];
let redoStack = [];

let startPos = {x: 0, y: 19};

let playerX = tileSize * 6;

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

            if (view.showHitboxes) {
                if (level[index] > 0) {
                    let shape = collisions[level[index] - 1];

                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    switch (shape.collisionType) {
                        case 1:
                            ctx.strokeStyle = 'red';
                            ctx.strokeRect(nx + shape.x, y * tileSize + yOffset + shape.y, shape.width, shape.height);
                            ctx.stroke();
                            break;
                        case 2: case 3: case 5: case 6: case 7: case 8:
                            ctx.strokeStyle = 'blue';
                            ctx.strokeRect(nx + shape.x, y * tileSize + yOffset + shape.y, shape.width, shape.height);
                            ctx.stroke();
                            break;
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

    ctx.font = '10px sans-serif'
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
    c.width = document.body.clientWidth;

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

    const diff = view.getInt32(32, ule);
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

    updateDiff(diff);

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
        changeSize(nw, nh);
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

    console.log(undoStack);

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
        } else if (keyName == 'e') {
            mouse.tool = 'start';
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
        if (levelX > width * tileSize) levelX = width * tileSize;
    });

    window.addEventListener('beforeunload', (event) => {
        if (!unsavedChanges) return;

        event.preventDefault();
        event.returnValue = '';
    });

    window.addEventListener('resize', () => {
        c.width = document.body.clientWidth;
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
            if (gridX + 18 > width) {
                changeSize(gridX + 18, height);
            }

            let levelY = gridY - (20 - height);

            if (levelY < 0) {
                changeSize(width, Math.min(20, height - levelY));
                levelY = 0;
            }

            if (mouse.tool == 'paint') {
                const index = levelY * width + gridX;

                if (level[index] != mouse.tileId) {
                    setTile(index, mouse.tileId);
                }
            } else if (mouse.tool == 'start') {
                startPos.x = gridX - 6;
                startPos.y = gridY;
            }

            autoResize();
        }

        for (let i = 0; i < pressedKeys.length; i++) { 
            let key = pressedKeys[i];
            if (!isNaN(Number(key))) mouse.tileId = Number(key);
            if (key == 'ArrowUp' && key != lastKey) {
                mouse.tileId = (mouse.tileId + 1) % 40;
                lastKey = key;
            } else if (key == 'ArrowDown' && key != lastKey) {
                mouse.tileId -= 1;
                if (mouse.tileId < 0) mouse.tileId = 39;
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
        else {
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
        ctx.moveTo(playerX - levelX, ground);
        for (let i = 0; i < oldPlayerPos.length - 1; i++) {
            let pos = oldPlayerPos[i+1];
            ctx.lineTo(pos.x - levelX, pos.y);
        }
        ctx.stroke();
    }

    window.requestAnimationFrame(update);
}

function swapTiles() {
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