int mismatchedBits(int first, int second) {
    // Unsigned, so the bit tricks never touch signed overflow
    unsigned int diff = (unsigned int)first ^ (unsigned int)second;
    int count = 0;
    while (diff != 0) {
        // Clears the lowest set bit
        diff &= diff - 1;
        count++;
    }
    return count;
}
