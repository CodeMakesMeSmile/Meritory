void readingsOnce(int* readings, int readingsSize) {
    int write = 0;
    for (int read = 0; read < readingsSize; read++) {
        // Repeats sit side by side, so compare with the last value kept
        if (write == 0 || readings[read] != readings[write - 1]) {
            readings[write] = readings[read];
            write++;
        }
    }
    for (int i = write; i < readingsSize; i++) {
        readings[i] = -1;
    }
}
