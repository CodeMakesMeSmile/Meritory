import java.util.HashMap;
import java.util.Map;

class Solution {
    public long exactKinds(int[] sightings, int k) {
        return atMost(sightings, k) - atMost(sightings, k - 1);
    }

    private static long atMost(int[] sightings, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        long stretches = 0;
        int left = 0;
        for (int right = 0; right < sightings.length; right++) {
            counts.merge(sightings[right], 1, Integer::sum);
            while (counts.size() > k) {
                int leaving = counts.merge(sightings[left], -1, Integer::sum);
                if (leaving == 0) {
                    counts.remove(sightings[left]);
                }
                left++;
            }
            // Every start from left to right gives a stretch with at most k kinds
            stretches += right - left + 1;
        }
        return stretches;
    }
}
