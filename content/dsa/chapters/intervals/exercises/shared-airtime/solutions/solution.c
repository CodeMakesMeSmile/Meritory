int sharedAirtime(int** first, int firstSize, int* firstColSize, int** second, int secondSize, int* secondColSize) {
    int total = 0;
    int i = 0;
    int j = 0;
    while (i < firstSize && j < secondSize) {
        // The two current broadcasts share from the later start to the earlier end
        int start = first[i][0] > second[j][0] ? first[i][0] : second[j][0];
        int end = first[i][1] < second[j][1] ? first[i][1] : second[j][1];
        if (start < end) total += end - start;
        // Whichever ends first can't share time with anything later in the other log
        if (first[i][1] < second[j][1]) {
            i++;
        } else {
            j++;
        }
    }
    return total;
}
