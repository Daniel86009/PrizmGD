typedef struct {
    int x;
    int y;
    int width;
    int height;
    int collisionType; /*
    0 = None
    1 = Box
    2 = Spike
    3 = Orb
    4 = Pad
    5 = Pink Orb
    6 = Pink Pad
    7 = Red Orb
    8 = Red Pad
    9 = Blue Orb
    10 = Blue Pad
    11 = Green Orb
    12 = Black Orb
    13 = Blue Portal
    14 = Yellow Portal
    */
} CollisionShape;

CollisionShape collisions[48] = {
    {0, 0, 24, 24, 1}, //Full box
    {9, 7, 6, 11, 2}, //Spike ^
    {7, 9, 11, 6, 2}, //Spike <
    {9, 6, 6, 11, 2}, //Spike ⌄
    {6, 9, 11, 6, 2}, //Spike >
    {0, 0, 24, 24, 3}, //Orb
    {0, 17, 24, 7, 4}, //Pad bottom
    {0, 0, 24, 7, 4}, //Pad top
    {0, 0, 24, 24, 5}, //Pink orb
    {0, 17, 24, 7, 6}, //Pink pad bottom
    {0, 0, 24, 7, 6}, //Pink pad top
    {0, 0, 24, 24, 7}, //Red orb
    {0, 17, 24, 7, 8}, //Red pad bottom
    {0, 0, 24, 7, 8}, //Red pad top
    {0, 0, 24, 24, 9}, //Blue orb
    {0, 17, 24, 7, 10}, //Blue pad bottom
    {0, 0, 24, 7, 10}, //Blue pad top
    {0, 0, 24, 24, 11}, //Green orb
    {0, 0, 24, 24, 12}, //Black orb
    {9, 16, 6, 7, 2}, //Ground spike ^^
    {9, 17, 6, 5, 2}, //Small spike ^
    {17, 9, 5, 6, 2}, //Small spike <
    {9, 2, 6, 5, 2}, //Small spike >
    {2, 9, 5, 6, 2}, //Small spike ⌄
    {0, 0, 24, 11, 1}, //Half box top
    {0, 13, 24, 11, 1}, //Half box bottom
    {0, 0, 24, 24, 1}, //Deco Boxes
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 1},
    {0, 0, 24, 24, 13}, //Blue portal top
    {0, 0, 24, 24, 13}, //Blue portal middle
    {0, 0, 24, 24, 13}, //Blue portal bottom
    {0, 0, 24, 24, 14}, //Yellow portal top
    {0, 0, 24, 24, 14}, //Yellow portal middle
    {0, 0, 24, 24, 14}, //Yellow portal bottom
    {0, 0, 24, 24, 0}, //Chains
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0} //Antenna thing
};