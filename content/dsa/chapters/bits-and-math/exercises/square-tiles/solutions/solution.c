int largestTile(int width, int length) {
    int a = width;
    int b = length;
    // Euclid's algorithm: the gcd of a and b is the gcd of b and a % b
    while (b != 0) {
        int rest = a % b;
        a = b;
        b = rest;
    }
    return a;
}
