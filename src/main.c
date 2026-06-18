#include <fxcg/display.h>
#include <fxcg/keyboard.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>

#include "sprites.h"
#include "levels.h"
#include "collisions.h"

const float sinEst[36] = {
    0.00f,  0.17f,  0.34f,  0.50f,  0.64f,  0.77f,  0.87f,  0.94f,  0.98f,  1.00f,
    0.98f,  0.94f,  0.87f,  0.77f,  0.64f,  0.50f,  0.34f,  0.17f,  0.00f, -0.17f,
   -0.34f, -0.50f, -0.64f, -0.77f, -0.87f, -0.94f, -0.98f, -1.00f, -0.98f, -0.94f,
   -0.87f, -0.77f, -0.64f, -0.50f, -0.34f, -0.17f
};
const float cosEst[36] = {
    1.00f,  0.98f,  0.94f,  0.87f,  0.77f,  0.64f,  0.50f,  0.34f,  0.17f,  0.00f,
   -0.17f, -0.34f, -0.50f, -0.64f, -0.77f, -0.87f, -0.94f, -0.98f, -1.00f, -0.98f,
   -0.94f, -0.87f, -0.77f, -0.64f, -0.50f, -0.34f, -0.17f,  0.00f,  0.17f,  0.34f,
    0.50f,  0.64f,  0.77f,  0.87f,  0.94f,  0.98f
};

//Map
const int tileSize = 24;
const float gravity = 1.98f * 1.5f;
const int ground = 192;

int levelId = 0;

float levelX = 0.0f;
float maxLevelY = 0.0f;
float levelY = 0.0f;

float scrollSpeed = 5.8f * 1.5f;

const bool drawHitboxes = false;

//Menu
bool onMenu = true;
bool isPaused = true;
int lastKey = -1;
int selection = 0;

//Player
float playerX = 140.0f;
float playerY = 167.0f;

float yVelocity = 0.0f;
const float jumpVel = -12.8f * 1.5f;

float playerRot = 0.0f;
const int playerSize = 24;

bool isGrounded = false;
bool pIsGrounded = false;
bool canJumpOrb = false;

int curOrbI = -1;
int lastOrbI = -1;

bool dead = false;

//24 x 13

int keyDown(int basic_keycode) {
	const unsigned short* keyboard_register = (unsigned short*)0xA44B0000;
	int row, col, word, bit;
	row = basic_keycode%10;
	col = basic_keycode/10-1;
	word = row>>1;
	bit = col + ((row&1)<<3);
	return (0 != (keyboard_register[word] & 1<<bit));
}

void fillArea(unsigned x,unsigned y,unsigned w,unsigned h,unsigned short col){
    unsigned short*s=(unsigned short*)GetVRAMAddress();
    s+=(y*384)+x;
    while(h--){
        unsigned w2=w;
        while(w2--)
            *s++=col;
        s+=384-w;
    }
}

void drawRotatedSquare(int centerX, int centerY, int size, float angleDegrees, color_t color) {
  color_t* VRAM = (color_t*)GetVRAMAddress();
  
  float cosA = cosEst[(int)angleDegrees / 10];
  float sinA = sinEst[(int)angleDegrees / 10];
  
  int halfSize = size / 2;
  
  int boundingRadius = (int)(halfSize * 1.415f) + 1;

  for (int dy = -boundingRadius; dy <= boundingRadius; dy++) {
    for (int dx = -boundingRadius; dx <= boundingRadius; dx++) {
      float rotX = dx * cosA + dy * sinA;
      float rotY = -dx * sinA + dy * cosA;
      
      if (rotX >= -halfSize && rotX <= halfSize && rotY >= -halfSize && rotY <= halfSize) {
        int screenX = centerX + dx;
        int screenY = centerY + dy;
        
        if (screenX >= 0 && screenX < LCD_WIDTH_PX && screenY >= 0 && screenY < LCD_HEIGHT_PX) {
          VRAM[screenY * LCD_WIDTH_PX + screenX] = color;
        }
      }
    }
  }
}

void drawRotatedSprite(const unsigned char* data, int centerX, int centerY, int size, float angle, color_t* palette) {
  color_t* VRAM = (color_t*)GetVRAMAddress();

  float cosA = cosEst[(int)angle / 10];
  float sinA = sinEst[(int)angle / 10];

  float r = size / 2;

  int boundingRadius = (int)(r * 1.415f) + 1;

  for (int dy = -boundingRadius; dy <= boundingRadius; dy++) {
    for (int dx = -boundingRadius; dx <= boundingRadius; dx++) {
      float rotX = dx * cosA + dy * sinA;
      float rotY = -dx * sinA + dy * cosA;

      float tx = rotX + r;
      float ty = rotY + r;

      if (tx >= 0.0f && tx < (float)size && ty >= 0.0f && ty < (float)size) {
        int screenX = centerX + dx;
        int screenY = centerY + dy;

        if (screenX >= 0 && screenX < LCD_WIDTH_PX && screenY >= 0 && screenY < LCD_HEIGHT_PX) {
          int srcX = (int)tx;
          int srcY = (int)ty;
          int spriteIndex = srcY * size + srcX;
          VRAM[screenY * LCD_WIDTH_PX + screenX] = palette[data[spriteIndex]];
        }
      }
    }
  }
}

void CopySpriteNbit(const unsigned char* data, int x, int y, int width, int height, color_t* palette, unsigned int bitwidth) {
  if (x + width <= 0 || x >= LCD_WIDTH_PX || y + height <= 0 || y >= LCD_HEIGHT_PX) return;

  color_t* VRAM = (color_t*)GetVRAMAddress();
  int offset = 0;
  unsigned char buf = 0;
  int availbits = 0;

  for (int j = 0; j < height; j++) {
    availbits = 0;
    buf = 0;

    if (y + j < 0 || y + j >= LCD_HEIGHT_PX) {
      offset += (width * bitwidth) / 8;
      continue;
    }

    for (int i = 0; i < width; i++) {
      if (!availbits) {
        buf = data[offset++];
        availbits = 8;
      }
      color_t colorIndex = ((color_t)buf >> (8 - bitwidth));
      buf <<= bitwidth;
      availbits -= bitwidth;

      if (x + i >= 0 && x + i < LCD_WIDTH_PX) {
        VRAM[(y + j) * LCD_WIDTH_PX + x + i] = palette[colorIndex];
      }
    }
  }
}

void CopySpriteNbitMasked(const unsigned char* data, int x, int y, int width, int height, const color_t* palette, color_t maskColor, unsigned int bitwidth) {
   color_t* VRAM = (color_t*) GetVRAMAddress();
   VRAM += (LCD_WIDTH_PX*y + x);
   int offset = 0;
   unsigned char buf;
   for (int j=y; j<y+height; j++) {
      int availbits = 0;
      for (int i=x; i<x+width;  i++) {
         if (!availbits) {
            buf = data[offset++];
            availbits = 8;
         }
         color_t this = ((color_t)buf>>(8-bitwidth));
         color_t color = palette[this];
         if (color != maskColor) {
            *VRAM = color;
         }
         VRAM++;
         buf<<=bitwidth;
         availbits-=bitwidth;
      }
      VRAM += (LCD_WIDTH_PX-width);
   }
}

void reset() {
  levelX = 0.0f;
  levelY = maxLevelY;
  playerY = 167.0f;
  yVelocity = 0.0f;
  playerRot = 0.0f;
  isGrounded = false;
  curOrbI = -1;
  lastOrbI = -1;
  dead = false;
}

void mainMenu() {
  if (keyDown(KEY_PRGM_RETURN) || keyDown(KEY_PRGM_SHIFT)) {
    if (lastKey != KEY_PRGM_RETURN) {
      onMenu = false;
      isPaused = false;
      reset();
      lastKey = keyDown(KEY_PRGM_RETURN) ? KEY_PRGM_RETURN : KEY_PRGM_SHIFT;
    }
  } else if (keyDown(KEY_PRGM_LEFT) && lastKey != KEY_PRGM_LEFT) {
    levelId = (levelId - 1 + levelCount) % levelCount;
    lastKey = KEY_PRGM_LEFT;
    maxLevelY = levels[levelId].h * tileSize - ground;
  } else if (keyDown(KEY_PRGM_RIGHT) && lastKey != KEY_PRGM_RIGHT) {
    levelId = (levelId + 1) % levelCount;
    lastKey = KEY_PRGM_RIGHT;
    maxLevelY = levels[levelId].h * tileSize - ground;
  }

  Bdisp_Fill_VRAM((color_t)0x4c3c, 3);

  int x = 0, y = 99;
  PrintMini(&x, &y, levels[levelId].name, 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 0, 0);
  x = 192 - x / 2;
  PrintMini(&x, &y, levels[levelId].name, 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 1, 0);
  CopySpriteNbitMasked(difficulties[levels[levelId].diff].data, 177, 80, 30, 30, difficulties[levels[levelId].diff].palette, (color_t)0x2589, 8);
}

void pauseMenu() {
  if (keyDown(KEY_PRGM_UP) && lastKey != KEY_PRGM_UP) {
    selection = (selection - 1 + 3) % 3;
    lastKey = KEY_PRGM_UP;
  } else if (keyDown(KEY_PRGM_DOWN) && lastKey != KEY_PRGM_DOWN) {
    selection = (selection + 1) % 3;
    lastKey = KEY_PRGM_DOWN;
  } else if (keyDown(KEY_PRGM_RETURN) || keyDown(KEY_PRGM_SHIFT)) {
    if (lastKey != KEY_PRGM_RETURN && lastKey != KEY_PRGM_SHIFT) {
      switch(selection) {
        case 0: isPaused = false; break;
        case 1: isPaused = false; dead = true; break;
        case 2: onMenu = true; break;
      }

      lastKey = keyDown(KEY_PRGM_RETURN) ? KEY_PRGM_RETURN : KEY_PRGM_SHIFT;
    }
  }

  color_t c[3] = {0x5dc3, 0x5dc3, 0x5dc3};

  c[selection] = (color_t)0x3bc2;

  fillArea(48, 27, 288, 162, (color_t)0x0844);

  //Resume
  fillArea(48 + 5, 27 + 5, 278, 47, c[0]);
  int x = 0, y = 23;
  PrintMini(&x, &y, "Resume", 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 0, 0);
  x = 53 + (278 / 2) - (x * 0.5);
  PrintMini(&x, &y, "Resume", 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 1, 0);

  //Restart
  fillArea(48 + 5, 27 + 47 + 10, 278, 47, c[1]);
  x = 0; y = 75;
  PrintMini(&x, &y, "Restart", 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 0, 0);
  x = 53 + (278 / 2) - (x * 0.5);
  PrintMini(&x, &y, "Restart", 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 1, 0);

  //Main Menu
  fillArea(48 + 5, 27 + 94 + 15, 278, 47, c[2]);
  x = 0; y = 127;
  PrintMini(&x, &y, "Main Menu", 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 0, 0);
  x = 53 + (278 / 2) - (x * 0.5);
  PrintMini(&x, &y, "Main Menu", 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 1, 0);
}

void drawMap(int xOffset, int yOffset) {
  int startCol = xOffset / tileSize;
  int endCol = startCol + 17;

  if (endCol > levels[levelId].w) endCol = levels[levelId].w;

  for (int x = startCol; x < endCol; x++) {
    for (int y = 0; y < levels[levelId].h; y++) {
      int index = y * levels[levelId].w + x;

      if (levels[levelId].layout[index]) {
        int nx = (x * tileSize) - xOffset;
        int ny = (y * tileSize) - yOffset;
        int type = levels[levelId].layout[index] - 1;
        CopySpriteNbit(tiles[type].data, nx, ny, tileSize, tileSize, (color_t*)tiles[type].palette, 8);

        if (drawHitboxes) {
          int hitX = nx + collisions[type].x;
          int hitY = ny + collisions[type].y;
          if (collisions[type].collisionType == 1) {
            Bdisp_Rectangle(hitX, hitY - 24, hitX + collisions[type].width, hitY + collisions[type].height - 24, 4);
          } else if (collisions[type].collisionType == 2 || collisions[type].collisionType == 3) {
            Bdisp_Rectangle(hitX, hitY - 24, hitX + collisions[type].width, hitY + collisions[type].height - 24, 1);
          }
        }
      }
    }
  }
}

bool AABB(int ax, int ay, int aw, int ah, int bx, int by, int bw, int bh) {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

void collide() {
  isGrounded = false;

  int pWX = (int)playerX + (int)levelX;
  int pWY = (int)playerY + (int)levelY;

  int oldPWX = pWX - scrollSpeed;
  int oldPWY = (int)(pWY - yVelocity);

  int startCol = (int)levelX / tileSize;
  if (startCol < 0) startCol = 0;
  
  int endCol = startCol + 17; 
  if (endCol > levels[levelId].w) endCol = levels[levelId].w;

  bool jumpPad = false;

  for (int x = startCol; x < endCol; x++) {
    for (int y = 0; y < levels[levelId].h; y++) {
      int mapIndex = y * levels[levelId].w + x;
      int tileID = levels[levelId].layout[mapIndex];

      if (tileID <= 0) continue;

      CollisionShape shape = collisions[tileID - 1];
      if (shape.collisionType == 4) continue;

      int tileWX = x * tileSize + shape.x;
      int tileWY = y * tileSize + shape.y;

      if (AABB(pWX, pWY, playerSize, playerSize, tileWX, tileWY, shape.width, shape.height)) {

        if (shape.collisionType == 2) {
          curOrbI = mapIndex;
          if (lastOrbI != curOrbI) canJumpOrb = true;
          continue;
        }
        
        if (shape.collisionType == 3) {
          curOrbI = mapIndex;
          if (lastOrbI != curOrbI) {
            playerY = (float)(tileWY - playerSize) - levelY;

            pWY = (int)playerY - playerSize;

            yVelocity = jumpVel * 1.36;
            lastOrbI = curOrbI;
            jumpPad = true;
          }
          continue;
        }

        if (shape.collisionType == 1) {
          dead = true;
          return;
        }

        if (shape.collisionType == 0) {
          if (yVelocity >= 0.0f && (oldPWY + (playerSize - playerSize / 4)) <= tileWY) {
            playerY = (float)(tileWY - playerSize) - levelY;
            yVelocity = 0.0f;
            isGrounded = true;
            pWY = tileWY - playerSize;
          } else if (yVelocity <= 0.0f && (oldPWY + playerSize / 4) >= (tileWY + shape.height)) {
            playerY = (float)(tileWY + shape.height) - levelY;
            yVelocity = 0.2f;
            pWY = tileWY + shape.height;
          } else {
            if (oldPWX + playerSize <= tileWX) {
              dead = true;
              return;
            } else if (oldPWX >= tileWX + shape.width) {
              dead = true;
              return;
            }
          }
        }
      }
    }
  }

  int worldGround = (levels[levelId].h * tileSize) - (int)levelY;
  if ((int)playerY + playerSize > worldGround) {
    playerY = (float)(worldGround - playerSize);
    if (jumpPad == false) yVelocity = 0.0f;
    isGrounded = true;
  }
}

void loop() {
  if (keyDown(KEY_PRGM_MENU)) {
    int key;
    GetKey(&key);
  }

  if (lastKey != -1 && !keyDown(lastKey)) {
    lastKey = -1;
  }

  if (keyDown(KEY_PRGM_EXIT) && !onMenu) {
    if (lastKey != KEY_PRGM_EXIT) {
      selection = 0;
      isPaused = !isPaused;
      lastKey = KEY_PRGM_EXIT;
    }
  }

  Bdisp_AllClr_VRAM();

  if (!isPaused) {
    levelX += scrollSpeed;
    if ((int)levelX >= (levels[levelId].w * tileSize) - LCD_WIDTH_PX) {
      reset();
    }

    if (keyDown(KEY_PRGM_UP) || keyDown(KEY_PRGM_SHIFT)) {
      if (canJumpOrb) {
        yVelocity = jumpVel * 1.1;
        lastOrbI = curOrbI;
      } else if (isGrounded) {
        yVelocity = jumpVel;
      }
    }

    yVelocity += gravity;
    playerY += yVelocity;

    isGrounded = false;
    canJumpOrb = false;
    collide();

    float oLevelY = levelY;
    
    if (playerY > 130.0f) {
      levelY += (playerY - 130.0f);
      if (levelY > maxLevelY) levelY = maxLevelY;
    } else if (playerY < 66.0f) {
      levelY += (playerY - 66.0f);
      if (levelY < -240.0f) levelY = -240.0f;
    }

    float cameraDeltaY = levelY - oLevelY;
    playerY -= cameraDeltaY;

    if (isGrounded == false && pIsGrounded == false) {
      playerRot += 18.0f;
    } else {
      playerRot = (float)(((int)(playerRot + 55.0f) / 90) * 90);
    }
    if (playerRot >= 360.0f) playerRot = 0.0f;

    if (dead) {
      reset();
      return;
    }

    pIsGrounded = isGrounded;
  }

  if (!onMenu) {
    Bdisp_Fill_VRAM((color_t)0x4c3c, 3);
    int vGroundY = (levels[levelId].h * tileSize) - (int)levelY;
    if (vGroundY < LCD_HEIGHT_PX) fillArea(0, vGroundY, LCD_WIDTH_PX, 1, (color_t)0x0000);
    drawMap((int)levelX, (int)levelY);
    drawRotatedSprite(icon, playerX + 12, playerY + 12, playerSize, playerRot, (color_t*)icon_palette);
  }

  if (isPaused) {
    if (onMenu) {
      mainMenu();
    } else {
      pauseMenu();
    }
  }

  Bdisp_PutDisp_DD();
}

int main() {
  // Clear VRAM
  Bdisp_AllClr_VRAM();
  //Enable colours
  Bdisp_EnableColor(1);
  //Stop top bar from appearing when keys are pressed
  EnableDisplayHeader(0, 0);
  EnableStatusArea(3);

  Bdisp_Fill_VRAM((color_t)0x4c3c, 3);

  maxLevelY = levels[levelId].h * tileSize - ground;

  while (1) {
    loop();
  }

  return 0;
}