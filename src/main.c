#include <fxcg/display.h>
#include <fxcg/keyboard.h>
#include <fxcg/rtc.h>
#include <fxcg/misc.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <math.h>

#include "sprites.h"
#include "load.h"
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
float targetRot = 0.0f;
const int playerSize = 24;

bool isGrounded = false;
bool pIsGrounded = false;
bool canJumpOrb[6] = {false, false, false, false, false, false};
bool hasJumped = false;

int curOrbI = -1;
int lastOrbI = -1;

bool dead = false;

bool rGrav = false;

int fps = 0;

//24 x 13

int sign(int val) {
  return (val > 0) - (val < 0);
}

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

void CopyTilesheetSprite(const unsigned char* data, int sx, int sy, int sWidth, int x, int y, int width, int height, color_t* palette) {
  if (x + width <= 0 || x >= LCD_WIDTH_PX || y + height <= 0 || y >= LCD_HEIGHT_PX) return;
  if (x < 0) {sx -= x; width += x; x = 0;}
  if (y < 0) {sy -= y; height += y; y = 0;}
  if (x + width > LCD_WIDTH_PX) width = LCD_WIDTH_PX - x;
  if (y + height > LCD_HEIGHT_PX) height = LCD_HEIGHT_PX - y;

  if (width <= 0 || height <= 0) return;

  color_t* VRAM = (color_t*)GetVRAMAddress();
  color_t* dRowPtr = VRAM + (y * LCD_WIDTH_PX) + x;

  const unsigned char* sRowPtr = data + (sy * sWidth) + sx;

  for (int j = 0; j < height; j++) {
    for (int i = 0; i < width; i++) {
      *dRowPtr++ = palette[*sRowPtr++];
    }

    dRowPtr += LCD_WIDTH_PX - width;
    sRowPtr += sWidth - width;
  }
}

void reset() {
  levelX = 0.0f;
  levelY = maxLevelY;
  playerY = 167.0f;
  yVelocity = 0.0f;
  playerRot = 0.0f;
  isGrounded = false;
  rGrav = false;
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
    maxLevelY = levels[levelId].header.h * tileSize - ground;
    loadLevelLayout(levelId);
  } else if (keyDown(KEY_PRGM_RIGHT) && lastKey != KEY_PRGM_RIGHT) {
    levelId = (levelId + 1) % levelCount;
    lastKey = KEY_PRGM_RIGHT;
    maxLevelY = levels[levelId].header.h * tileSize - ground;
    loadLevelLayout(levelId);
  }

  Bdisp_Fill_VRAM((color_t)0x4c3c, 3);

  if (levelCount == 0) {
    int x = 60, y = 99;
    PrintMini(&x, &y, "No levels found in", 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 1, 0);
    x = 60; y = 115;
    PrintMini(&x, &y, "\\\\fls0\\GDLEVELS\\", 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 1, 0);
    return;
  }

  int x = 0, y = 99;
  PrintMini(&x, &y, levels[levelId].header.name, 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 0, 0);
  x = 192 - x / 2;
  PrintMini(&x, &y, levels[levelId].header.name, 0x02, 0xFFFFFFFF, 0, 0, 0, 0, 1, 0);
  CopySpriteNbitMasked(difficulties[levels[levelId].header.diff].data, 177, 80, 30, 30, difficulties[levels[levelId].header.diff].palette, (color_t)0x2589, 8);
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

  if (endCol > levels[levelId].header.w) endCol = levels[levelId].header.w;

  for (int x = startCol; x < endCol; x++) {
    for (int y = 0; y < levels[levelId].header.h; y++) {
      int index = y * levels[levelId].header.w + x;

      if (curLayout[index]) {
        int nx = (x * tileSize) - xOffset;
        int ny = (y * tileSize) - yOffset;
        int type = curLayout[index] - 1;
        int sx = (type % 10) * tileSize;
        int sy = (type / 10) * tileSize;

        CopyTilesheetSprite(tilesheet, sx, sy, 240, nx, ny, tileSize, tileSize, (color_t*)tilesheet_palette);

        //Draw hitboxes
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
  int pWX = (int)playerX + (int)levelX;
  int pWY = (int)playerY + (int)levelY;

  int oldPWX = pWX - scrollSpeed;
  int oldPWY = rGrav ? (int)(pWY + yVelocity) : (int)(pWY - yVelocity);

  int startCol = (int)levelX / tileSize;
  if (startCol < 0) startCol = 0;
  
  int endCol = startCol + 17; 
  if (endCol > levels[levelId].header.w) endCol = levels[levelId].header.w;

  bool jumpPad = false;

  for (int x = startCol; x < endCol; x++) {
    for (int y = 0; y < levels[levelId].header.h; y++) {
      int mapIndex = y * levels[levelId].header.w + x;
      int tileID = curLayout[mapIndex];

      if (tileID <= 0) continue;

      CollisionShape shape = collisions[tileID - 1];
      if (shape.collisionType == 0) continue;

      int tileWX = x * tileSize + shape.x;
      int tileWY = y * tileSize + shape.y;

      if (AABB(pWX, pWY, playerSize, playerSize, tileWX, tileWY, shape.width, shape.height)) {
        switch (shape.collisionType) {
          case 2: //Spike
            dead = true;
            return;
          case 3: case 5: case 7: case 9: case 11: case 12: //Orbs
            curOrbI = mapIndex;
            if (lastOrbI != curOrbI) {
              switch (shape.collisionType) {
                case 3: canJumpOrb[0] = true; break;
                case 5: canJumpOrb[1] = true; break;
                case 7: canJumpOrb[2] = true; break;
                case 9: canJumpOrb[3] = true; break;
                case 11: canJumpOrb[4] = true; break;
                case 12: canJumpOrb[5] = true; break;
              }
            } 
            continue;
          case 4: //Yellow Pad
            curOrbI = mapIndex;
            if (lastOrbI != curOrbI) {
              playerY = (float)(tileWY - playerSize) - levelY;

              pWY = (int)playerY - playerSize;

              yVelocity = jumpVel * 1.36;
              
              lastOrbI = curOrbI;
              jumpPad = true;
            }
            continue;
          case 6: //Pink Pad
            curOrbI = mapIndex;
            if (lastOrbI != curOrbI) {
              playerY = (float)(tileWY - playerSize) - levelY;

              pWY = (int)playerY - playerSize;

              yVelocity = jumpVel * 0.88;
              
              lastOrbI = curOrbI;
              jumpPad = true;
            }
            continue;
          case 8: //Red Pad
            curOrbI = mapIndex;
            if (lastOrbI != curOrbI) {
              playerY = (float)(tileWY - playerSize) - levelY;

              pWY = (int)playerY - playerSize;

              yVelocity = jumpVel * 1.69;
              
              lastOrbI = curOrbI;
              jumpPad = true;
            }
            continue;
          case 10: //Blue Pad
            curOrbI = mapIndex;
            if (lastOrbI != curOrbI) {
              rGrav = !rGrav;
              
              if (!rGrav) {
                playerY = (float)(tileWY + shape.height) - levelY;
                yVelocity = -jumpVel * 0.5;
              } else {
                playerY = (float)(tileWY - playerSize) - levelY;
                yVelocity = -jumpVel * 0.5;
              }
              
              pWY = (int)playerY + (int)levelY;
              lastOrbI = curOrbI;
              jumpPad = true;
            }
            continue;
          case 13:
            if (rGrav != false) {
              rGrav = false;
              yVelocity = -yVelocity;
            }
            continue;
          case 14:
            if (rGrav != true) {
              rGrav = true;
              yVelocity = -yVelocity;
            }
            continue;
          }

        if (shape.collisionType == 1) {
          if (rGrav) {
            //Reversed gravity
            if (yVelocity >= 0.0f && (oldPWY + playerSize / 4) >= (tileWY + shape.height)) {
              playerY = (float)(tileWY + playerSize) - levelY;
              yVelocity = 0.0f;
              isGrounded = true;
              pWY = tileWY + shape.height;
            } else if (yVelocity < 0.0f && (oldPWY + (playerSize - playerSize / 4)) <= tileWY) {
              playerY = (float)(tileWY - playerSize) - levelY;
              yVelocity = 0.2f;
              pWY = tileWY - playerSize;
            } else {
              if (oldPWX + playerSize <= tileWX || oldPWX >= tileWX + shape.width) {
                dead = true;
                return;
              }
            }
          } else {
            //Normal gravity
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
              if (oldPWX + playerSize <= tileWX || oldPWX >= tileWX + shape.width) {
                dead = true;
                return;
              }
            }
          }
        }
      }
    }
  }

  int worldGround = (levels[levelId].header.h * tileSize) - (int)levelY;
  if ((int)playerY + playerSize > worldGround) {
    playerY = (float)(worldGround - playerSize);
    if (jumpPad == false) yVelocity = 0.0f;
    isGrounded = true;
  }
}

bool checkJumpOrb() {
  if (hasJumped) return true;
  
  if (canJumpOrb[0]) {
    yVelocity = jumpVel;
    lastOrbI = curOrbI;
    hasJumped = true;
    return false;
  } else if (canJumpOrb[1]) {
    yVelocity = jumpVel * 0.8;
    lastOrbI = curOrbI;
    hasJumped = true;
    return false;
  } else if (canJumpOrb[2]) {
    yVelocity = jumpVel * 1.3;
    lastOrbI = curOrbI;
    hasJumped = true;
    return false;
  } else if (canJumpOrb[3]) {
    rGrav = !rGrav;
    yVelocity = -jumpVel * 0.5;
    lastOrbI = curOrbI;
    hasJumped = true;
    return false;
  } else if (canJumpOrb[4]) {
    rGrav = !rGrav;
    yVelocity = jumpVel;
    lastOrbI = curOrbI;
    hasJumped = true;
    return false;
  } else if (canJumpOrb[5]) {
    yVelocity = -jumpVel;
    lastOrbI = curOrbI;
    hasJumped = true;
    return false;
  }

  return true;
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

    if ((int)levelX >= (levels[levelId].header.w * tileSize) - LCD_WIDTH_PX) {
      reset();
    }

    if (keyDown(KEY_PRGM_UP) || keyDown(KEY_PRGM_SHIFT)) {
      if (checkJumpOrb() && isGrounded) {
        yVelocity = jumpVel;
        hasJumped = true;
      }
    }
    if (!keyDown(KEY_PRGM_UP) && !keyDown(KEY_PRGM_SHIFT)) hasJumped = false;

    yVelocity += gravity;
    if (rGrav) playerY -= yVelocity;
    else playerY += yVelocity;

    isGrounded = false;
    for (int i = 0; i < 6; i++) canJumpOrb[i] = false;
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
      if (rGrav) targetRot -= 18;
      else targetRot += 18;
    } else {
      const float r = rGrav ? 9.0f : 54.0f;
      targetRot = (float)(((int)(playerRot + r) / 90) * 90);
    }
    if (targetRot >= 360.0f) targetRot = 0.0f;
    if (targetRot < 0.0f) targetRot = 360.0f;

    int diff = (((int)(targetRot - playerRot) + 540) % 360) - 180;

    if (sign(diff) * diff <= 18) {
      playerRot = targetRot;
    } else {
      playerRot += sign(diff) * 18;
    }
    if (playerRot >= 360.0f) playerRot = 0.0f;
    if (playerRot < 0.0f) playerRot = 0.0f;

    //Out of bounds check
    if (levelY < -230.0f) dead = true;

    if (dead) {
      reset();
      return;
    }

    pIsGrounded = isGrounded;
  }

  if (!onMenu) {
    Bdisp_Fill_VRAM((color_t)0x4c3c, 3);
    int vGroundY = (levels[levelId].header.h * tileSize) - (int)levelY;
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

  //Bdisp_PutDisp_DD();
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

  loadLevelList();

  if (levelCount > 0) {
    loadLevelLayout(levelId);
    maxLevelY = levels[levelId].header.h * tileSize - ground;
  }

  int startTime = RTC_GetTicks();

  while (1) {
    loop();

    int currentTime = RTC_GetTicks();
    int elapsed = currentTime - startTime;

    int x = 0, y = 0;
    char str[10];
    itoa((int)(128.0f / (float)elapsed), (unsigned char*)str);
    PrintMiniMini(&x, &y, str, 0b00000010, TEXT_COLOR_BLACK, 0);
    Bdisp_PutDisp_DD();

    startTime = currentTime;
  }

  return 0;
}