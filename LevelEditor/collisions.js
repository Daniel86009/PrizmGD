const collisions = [
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 }, // Full box
    { x: 9, y: 7, width: 6, height: 11, collisionType: 1 },  // Spike ^
    { x: 7, y: 9, width: 11, height: 6, collisionType: 1 },  // Spike <
    { x: 9, y: 6, width: 6, height: 11, collisionType: 1 },  // Spike ⌄
    { x: 6, y: 9, width: 11, height: 6, collisionType: 1 },  // Spike >
    { x: 0, y: 0, width: 24, height: 24, collisionType: 2 }, // Orb
    { x: 0, y: 17, width: 24, height: 7, collisionType: 3 }, // Pad bottom
    { x: 0, y: 0, width: 24, height: 7, collisionType: 3 },  // Pad top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 5 }, // Blue orb
    { x: 0, y: 17, width: 24, height: 7, collisionType: 6 }, // Blue pad bottom
    { x: 0, y: 0, width: 24, height: 7, collisionType: 6 },  // Blue pad top
    { x: 9, y: 16, width: 6, height: 7, collisionType: 1 },  // Ground spike ^^
    { x: 9, y: 17, width: 6, height: 5, collisionType: 1 },  // Small spike ^
    { x: 17, y: 9, width: 5, height: 6, collisionType: 1 },  // Small spike <
    { x: 9, y: 2, width: 6, height: 5, collisionType: 1 },   // Small spike >
    { x: 2, y: 9, width: 5, height: 6, collisionType: 1 },   // Small spike ⌄
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 }, // Half box
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 }, // Deco Boxes
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 0 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 7 }, // Blue portal top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 7 }, // Blue portal middle
    { x: 0, y: 0, width: 24, height: 24, collisionType: 7 }, // Blue portal bottom
    { x: 0, y: 0, width: 24, height: 24, collisionType: 8 }, // Yellow portal top
    { x: 0, y: 0, width: 24, height: 24, collisionType: 8 }, // Yellow portal middle
    { x: 0, y: 0, width: 24, height: 24, collisionType: 8 }, // Yellow portal bottom
    { x: 0, y: 0, width: 24, height: 24, collisionType: 4 }, // Chains
    { x: 0, y: 0, width: 24, height: 24, collisionType: 4 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 4 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 4 },
    { x: 0, y: 0, width: 24, height: 24, collisionType: 4 }  // Antenna thing
];