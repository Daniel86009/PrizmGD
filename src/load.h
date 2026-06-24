#ifndef _LOAD
#define _LOAD

#define MAX_LEVELS      30
#define MAX_NAME_LEN    32
#define MAX_LAYOUT_SIZE 30000

typedef struct {
  char name[MAX_NAME_LEN];
  int diff;
  int w;
  int h;
} LevelHeader;

typedef struct {
  LevelHeader header;
  unsigned short filepath[267];
} LevelMetadata;

extern LevelMetadata levels[MAX_LEVELS];
extern int levelCount;
extern unsigned char curLayout[MAX_LAYOUT_SIZE];

void loadLevelList();
int loadLevelLayout(int levelId);

#endif