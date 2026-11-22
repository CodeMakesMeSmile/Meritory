int mostRuns(int* books, int booksSize) {
    int runs = 0;
    // The farthest place any book in this run has to reach
    int reach = 0;
    for (int i = 0; i < booksSize; i++) {
        if (books[i] > reach) reach = books[i];
        // Every book so far belongs at or before here, so the run can end
        if (reach == i) runs++;
    }
    return runs;
}
