import java.util.HashMap;
import java.util.Map;

class Solution {
    public int noRepeatDinners(int[] dinners, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        // How many dishes appear more than once in the window
        int repeated = 0;
        int stretches = 0;
        for (int right = 0; right < dinners.length; right++) {
            int entering = counts.merge(dinners[right], 1, Integer::sum);
            if (entering == 2) {
                repeated++;
            }
            if (right >= k) {
                int leaving = counts.merge(dinners[right - k], -1, Integer::sum);
                if (leaving == 1) {
                    repeated--;
                }
            }
            if (right >= k - 1 && repeated == 0) {
                stretches++;
            }
        }
        return stretches;
    }
}
