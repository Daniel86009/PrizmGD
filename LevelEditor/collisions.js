const collisions = [
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 }, //Full box
    { x: 9, y: 7, width: 6, height: 11, collisionType: 2 }, //Spike ^
    { x: 7, y: 9, width: 11, height: 6, collisionType: 2 }, //Spike <
    { x: 9, y: 6, width: 6, height: 11, collisionType: 2 }, //Spike ⌄
    { x: 6, y: 9, width: 11, height: 6, collisionType: 2 }, //Spike >
    { x: 0, y: 0, width: 24, height: 24, collisionType: 3 }, //Orb
    { x: 0, y: 17, width: 24, height: 7, collisionType: 4 }, //Pad bottom
    { x: 0, y: 0, width: 24, height: 7, collisionType: 4 }, //Pad top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 5 }, //Pink orb
    { x: 0, y: 17, width: 24, height: 7, collisionType: 6 }, //Pink pad bottom
    { x: 0, y: 0, width: 24, height: 7, collisionType: 6 }, //Pink pad top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 7 }, //Red orb
    { x: 0, y: 17, width: 24, height: 7, collisionType: 8 }, //Red pad bottom
    { x: 0, y: 0, width: 24, height: 7, collisionType: 8 }, //Red pad top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 9 }, //Blue orb
    { x: 0, y: 17, width: 24, height: 7, collisionType: 10 }, //Blue pad bottom
    { x: 0, y: 0, width: 24, height: 7, collisionType: 10 }, //Blue pad top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 11 }, //Green orb
    { x: 0, y: 0, width: 24, height: 24, collisionType: 12 }, //Black orb
    { x: 9, y: 16, width: 6, height: 7, collisionType: 2 }, //Ground spike ^^
    { x: 9, y: 17, width: 6, height: 5, collisionType: 2 }, //Small spike ^
    { x: 17, y: 9, width: 5, height: 6, collisionType: 2 }, //Small spike <
    { x: 9, y: 2, width: 6, height: 5, collisionType: 2 }, //Small spike >
    { x: 2, y: 9, width: 5, height: 6, collisionType: 2 }, //Small spike ⌄
    { x: 0, y: 0, width: 24, height: 11, collisionType: 1 }, //Half box top
    { x: 0, y: 13, width: 24, height: 11, collisionType: 1 }, //Half box bottom
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 }, //Deco Boxes
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 1 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 13 }, //Blue portal top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 13 }, //Blue portal middle
    { x: 0, y: 0, width: 24, height: 24, collisionType: 13 }, //Blue portal bottom
    { x: 0, y: 0, width: 24, height: 24, collisionType: 14 }, //Yellow portal top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 14 }, //Yellow portal middle
    { x: 0, y: 0, width: 24, height: 24, collisionType: 14 }, //Yellow portal bottom
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 }, //Chains
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 } //Antenna thing
];