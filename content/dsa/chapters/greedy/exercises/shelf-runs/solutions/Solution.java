class Solution {
    public int mostRuns(int[] books) {
        int runs = 0;
        // The farthest place any book in this run has to reach
        int reach = 0;
        for (int i = 0; i < books.length; i++) {
            reach = Math.max(reach, books[i]);
            // Every book so far belongs at or before here, so the run can end
            if (reach == i) runs++;
        }
        return runs;
    }
}
