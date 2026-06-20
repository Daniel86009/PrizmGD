typedef struct {
    int x;
    int y;
    int width;
    int height;
    int collisionType; /*
    0 = Box
    1 = Spike
    2 = Orb
    3 = Pad
    4 = None
    5 = Blue Orb
    6 = Blue pad
    7 = Blue portal
    8 = Yellow portal
    */
} CollisionShape;

CollisionShape collisions[39] = {
    {0, 0, 24, 24, 0}, //Full box
    {9, 7, 6, 11, 1}, //Spike ^
    {7, 9, 11, 6, 1}, //Spike <
    {9, 6, 6, 11, 1}, //Spike ⌄
    {6, 9, 11, 6, 1}, //Spike >
    {0, 0, 24, 24, 2}, //Orb
    {0, 17, 24, 7, 3}, //Pad bottom
    {0, 0, 24, 7, 3}, //Pad top
    {0, 0, 24, 24, 5}, //Blue orb
    {0, 17, 24, 7, 6}, //Blue pad bottom
    {0, 0, 24, 7, 6}, //Blue pad top
    {9, 16, 6, 7, 1}, //Ground spike ^^
    {9, 17, 6, 5, 1}, //Small spike ^
    {17, 9, 5, 6, 1}, //Small spike <
    {9, 2, 6, 5, 1}, //Small spike >
    {2, 9, 5, 6, 1}, //Small spike ⌄
    {0, 0, 24, 24, 0}, //Half box
    {0, 0, 24, 24, 0}, //Deco Boxes
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 0},
    {0, 0, 24, 24, 7}, //Blue portal top
    {0, 0, 24, 24, 7}, //Blue portal middle
    {0, 0, 24, 24, 7}, //Blue portal bottom
    {0, 0, 24, 24, 8}, //Yellow portal top
    {0, 0, 24, 24, 8}, //Yellow portal middle
    {0, 0, 24, 24, 8}, //Yellow portal bottom
    {0, 0, 24, 24, 4}, //Chains
    {0, 0, 24, 24, 4},
    {0, 0, 24, 24, 4},
    {0, 0, 24, 24, 4},
    {0, 0, 24, 24, 4} //Antenna thing
};