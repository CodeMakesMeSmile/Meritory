import java.util.ArrayList;
import java.util.List;

class Solution {
    private final List<int[]> moves = new ArrayList<>();

    public int[][] moveCrates(int count, int start, int goal) {
        moves.clear();
        move(count, start, goal);
        return moves.toArray(new int[0][]);
    }

    // Moves the top n crates from one bay to another, using the third as a spare
    private void move(int n, int from, int to) {
        if (n == 0) return;
        // The bays add up to 6, so the spare is what's left
        int spare = 6 - from - to;
        move(n - 1, from, spare);
        moves.add(new int[] {from, to});
        move(n - 1, spare, to);
    }
}
