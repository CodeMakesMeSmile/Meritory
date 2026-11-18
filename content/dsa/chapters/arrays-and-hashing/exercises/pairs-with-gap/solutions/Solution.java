import java.util.HashMap;
import java.util.Map;

class Solution {
    public long pairsWithGap(int[] scores, int gap) {
        Map<Integer, Integer> counts = new HashMap<>();
        long pairs = 0;
        for (int score : scores) {
            pairs += counts.getOrDefault(score - gap, 0);
            if (gap != 0) {
                pairs += counts.getOrDefault(score + gap, 0);
            }
            counts.merge(score, 1, Integer::sum);
        }
        return pairs;
    }
}
