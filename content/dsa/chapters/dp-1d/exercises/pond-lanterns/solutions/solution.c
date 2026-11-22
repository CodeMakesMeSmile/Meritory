// The most brightness from glow[from] to glow[to - 1] in a straight row
static int bestInRow(int* glow, int from, int to) {
    int before = 0;
    int best = 0;
    for (int i = from; i < to; i++) {
        int take = before + glow[i];
        int next = take > best ? take : best;
        before = best;
        best = next;
    }
    return best;
}

int brightestRing(int* glow, int glowSize) {
    if (glowSize == 1) return glow[0];
    // The first and last are neighbours, so leave out one of them each time
    int withoutLast = bestInRow(glow, 0, glowSize - 1);
    int withoutFirst = bestInRow(glow, 1, glowSize);
    return withoutLast > withoutFirst ? withoutLast : withoutFirst;
}
