typedef struct {
    int x;
    int y;
    int width;
    int height;
    int collisionType; //0 = Box, 1 = Spike, 2 = Orb, 3 = Pad, 4 = None
} CollisionShape;

CollisionShape collisions[29] = {
    {0, 0, 24, 24, 0}, //Full box
    {9, 7, 6, 11, 1}, //Spike ^
    {7, 9, 11, 6, 1}, //Spike <
    {9, 6, 6, 11, 1}, //Spike ⌄
    {6, 9, 11, 6, 1}, //Spike >
    {0, 0, 24, 24, 2}, //Orb
    {0, 17, 24, 7, 3}, //Pad
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
    {9, 16, 6, 7, 1}, //Ground spike ^^
    {0, 0, 24, 24, 4}, //Chains
    {0, 0, 24, 24, 4},
    {0, 0, 24, 24, 4},
    {0, 0, 24, 24, 4},
    {0, 0, 24, 24, 4} //Antenna thing
};