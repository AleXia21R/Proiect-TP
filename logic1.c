int brushSize = 8;

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
