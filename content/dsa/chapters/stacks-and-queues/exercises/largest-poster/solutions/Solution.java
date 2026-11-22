class Solution {
    public int largestPoster(int[] boards) {
        int best = 0;
        // Positions of boards whose heights rise from bottom to top
        int[] rising = new int[boards.length + 1];
        int top = 0;
        for (int i = 0; i <= boards.length; i++) {
            // A height of 0 past the end pops every board still waiting
            int height = i < boards.length ? boards[i] : 0;
            while (top > 0 && boards[rising[top - 1]] >= height) {
                int board = rising[--top];
                // The board now under it is the nearest shorter one on the left
                int left = top > 0 ? rising[top - 1] : -1;
                best = Math.max(best, boards[board] * (i - left - 1));
            }
            rising[top++] = i;
        }
        return best;
    }
}
