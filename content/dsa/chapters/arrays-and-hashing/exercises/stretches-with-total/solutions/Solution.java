import java.util.HashMap;
import java.util.Map;

class Solution {
    public long stretchesWithTotal(int[] changes, int total) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);
        int sum = 0;
        long stretches = 0;
        for (int change : changes) {
            sum += change;
            stretches += seen.getOrDefault(sum - total, 0);
            seen.merge(sum, 1, Integer::sum);
        }
        return stretches;
    }
}
