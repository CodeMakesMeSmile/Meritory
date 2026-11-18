int balancePoint(int* weights, int weightsSize) {
    int right = 0;
    for (int i = 0; i < weightsSize; i++) right += weights[i];
    int left = 0;
    for (int i = 0; i < weightsSize; i++) {
        right -= weights[i];
        if (left == right) return i;
        left += weights[i];
    }
    return -1;
}
