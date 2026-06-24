#include <fxcg/file.h>
#include <string.h>
#include "load.h"

LevelMetadata levels[MAX_LEVELS];
int levelCount = 0;
unsigned char curLayout[MAX_LAYOUT_SIZE];

/*static void itoa_buf(char *buf, int n) {
  if (n == 0) { buf[0]='0'; buf[1]='\0'; return; }
  char tmp[12]; int i=0;
  if (n < 0) { buf[0]='-'; itoa_buf(buf+1, -n); return; }
  while (n > 0) { tmp[i++] = '0' + (n % 10); n /= 10; }
  int j = 0; while (i > 0) buf[j++] = tmp[--i]; buf[j] = '\0';
}*/

static void narrow_to_wide(unsigned short *dest, const char *src) {
  while (*src) *dest++ = (unsigned short)(unsigned char)*src++;
  *dest = 0;
}

static void wide_strcat(unsigned short *dest, const unsigned short *src) {
  while (*dest) dest++;
  while ((*dest++ = *src++));
}

void loadLevelList() {
  int handle = -1;
  levelCount = 0;

  unsigned short path[64];
  narrow_to_wide(path, "\\\\fls0\\GDLEVELS\\*.LVL");

  unsigned int foundfile_buf[134];
  unsigned short *foundfile = (unsigned short*)foundfile_buf;
  memset(foundfile_buf, 0, sizeof(foundfile_buf));

  unsigned int fileinfo_buf[64];
  memset(fileinfo_buf, 0, sizeof(fileinfo_buf));

  int result = Bfile_FindFirst(
    (const char*)path,
    &handle,
    (char*)foundfile,
    (char*)fileinfo_buf
  );

  if (result == -1 && handle >= 0 && foundfile[0] != 0) {
    result = 0;
  }

  while (result == 0 && levelCount < MAX_LEVELS) {
    unsigned short *fp = levels[levelCount].filepath;

    if (foundfile[0] == (unsigned short)'\\') {
      unsigned short *src = foundfile;
      while (*src) *fp++ = *src++;
      *fp = 0;
    } else {
      narrow_to_wide(fp, "\\\\fls0\\GDLEVELS\\");
      wide_strcat(fp, foundfile);
    }

    int file_h = Bfile_OpenFile_OS(levels[levelCount].filepath, 0x01, 0);
    if (file_h >= 0) {
      Bfile_ReadFile_OS(file_h, &levels[levelCount].header, sizeof(LevelHeader), 0);
      Bfile_CloseFile_OS(file_h);
      levelCount++;
    }

    memset(foundfile_buf, 0, sizeof(foundfile_buf));
    
    result = Bfile_FindNext(handle, (char*)foundfile, (char*)fileinfo_buf);

    if (result == -1 && foundfile[0] != 0) {
      result = 0;
    }
  }
}

int loadLevelLayout(int levelId) {
  if (levelId < 0 || levelId >= levelCount) return -1;

  int file_h = Bfile_OpenFile_OS(levels[levelId].filepath, 0x01, 0);
  if (file_h < 0) return -1;

  int layout_bytes = levels[levelId].header.w * levels[levelId].header.h * (int)sizeof(int);
  if (layout_bytes > MAX_LAYOUT_SIZE)
    layout_bytes = MAX_LAYOUT_SIZE;

  Bfile_ReadFile_OS(file_h, curLayout, layout_bytes, sizeof(LevelHeader));
  Bfile_CloseFile_OS(file_h);
  return 0;
}