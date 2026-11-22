int biggestBanner(int* heights, int heightsSize) {
    int best = 0;
    int left = 0;
    int right = heightsSize - 1;
    while (left < right) {
        int height = heights[left] < heights[right] ? heights[left] : heights[right];
        int area = height * (right - left);
        if (area > best) best = area;
        // Any closer partner for the shorter post makes a smaller banner
        if (heights[left] < heights[right]) {
            left++;
        } else {
            right--;
        }
    }
    return best;
}
