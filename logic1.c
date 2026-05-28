int players = 1;
int rounds = 3;
int drawTime = 60;
int brushSize = 8;

void set_game_config(int p, int r, int t) {
    if (p < 1) p = 1;
    if (p > 6) p = 6;

    if (r < 3) r = 3;
    if (r > 8) r = 8;

    if (t != 20 && t != 30 && t != 45 && t != 60) {
        t = 60;
    }

    players = p;
    rounds = r;
    drawTime = t;
}

int get_players() {
    return players;
}

int get_rounds() {
    return rounds;
}

int get_draw_time() {
    return drawTime;
}

void set_brush_size(int size) {
    if (size < 2) size = 2;
    if (size > 40) size = 40;

    brushSize = size;
}

void change_brush_size(int value) {
    brushSize += value;

    if (brushSize < 2) brushSize = 2;
    if (brushSize > 40) brushSize = 40;
}

int get_brush_size() {
    return brushSize;
}

int should_clear_canvas() {
    return 1;
}
