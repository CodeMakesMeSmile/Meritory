int rainBetweenWalls(int* walls, int wallsSize) {
    int water = 0;
    int left = 0;
    int right = wallsSize - 1;
    int tallestLeft = 0;
    int tallestRight = 0;
    while (left < right) {
        if (walls[left] > tallestLeft) tallestLeft = walls[left];
        if (walls[right] > tallestRight) tallestRight = walls[right];
        // The other side already has a taller wall, so the lower one sets the level
        if (tallestLeft < tallestRight) {
            water += tallestLeft - walls[left];
            left++;
        } else {
            water += tallestRight - walls[right];
            right--;
        }
    }
    return water;
}
