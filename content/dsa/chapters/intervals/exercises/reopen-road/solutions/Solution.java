import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[][] reopenStretch(int[][] closures, int[] reopened) {
        int from = reopened[0];
        int to = reopened[1];
        List<int[]> left = new ArrayList<>();
        for (int[] closure : closures) {
            // Keep whatever sticks out before the reopened stretch, and after it
            if (closure[0] < from) left.add(new int[] {closure[0], Math.min(closure[1], from)});
            if (closure[1] > to) left.add(new int[] {Math.max(closure[0], to), closure[1]});
        }
        return left.toArray(new int[0][]);
    }
}
