int cheapestClimb(int* tolls, int tollsSize) {
    // The least paid to stand on the landing two below and the landing one below
    int before = tolls[0];
    int last = tolls[1];
    for (int i = 2; i < tollsSize; i++) {
        // Reach landing i from one or two landings below, then pay its toll
        int next = tolls[i] + (before < last ? before : last);
        before = last;
        last = next;
    }
    // The roof can be reached from either of the top two landings
    return before < last ? before : last;
}
