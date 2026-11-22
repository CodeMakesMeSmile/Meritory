// How many heights are at most limit, walking left from the top right as the rows go down
static int countAtMost(int** heights, int rows, int cols, long long limit) {
    int count = 0;
    int col = cols - 1;
    for (int row = 0; row < rows; row++) {
        while (col >= 0 && heights[row][col] > limit) col--;
        count += col + 1;
    }
    return count;
}

int kthLowest(int** heights, int heightsSize, int* heightsColSize, int k) {
    int rows = heightsSize;
    int cols = heightsColSize[0];
    // Long longs, since hi - lo can reach 2 billion and pass the int limit
    long long lo = heights[0][0];
    long long hi = heights[rows - 1][cols - 1];
    // Every height before lo has fewer than k at or below it, and every one from hi on has k or more
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (countAtMost(heights, rows, cols, mid) >= k) hi = mid;
        else lo = mid + 1;
    }
    return (int)lo;
}
