const tileSelect = document.querySelector('.tileSelect');

function populateTileSelect() {
    for (let i = 0; i < 48; i++) {
        const elem = document.createElement('canvas');
        elem.width = 48;
        elem.height = 48;

        elem.addEventListener('click', (e) => {
            mouse.tileId = i;
        });

        tctx = elem.getContext('2d');
        const tilesPerRow = 10;

        const sx = ((i-1) % tilesPerRow) * 24;
        const sy = Math.floor((i-1) / tilesPerRow) * sTileSize;

        tctx.beginPath();
        tctx.drawImage(tileSheet, sx, sy, sTileSize, sTileSize, 0, 0, 48, 48);

        tileSelect.appendChild(elem);
    }
}

function createPopup(text) {
    const popupCont = document.querySelector(".popupCont");
    let div = document.createElement('div');

    div.classList.add("popup");
    div.innerHTML = `<p>${text}</p>`;

    popupCont.appendChild(div);

    div.offsetHeight;

    setTimeout(() => {
        div.classList.add("fading");
        setTimeout(() => {
            div.remove();
        }, 3000);
    }, 5000); 
}
