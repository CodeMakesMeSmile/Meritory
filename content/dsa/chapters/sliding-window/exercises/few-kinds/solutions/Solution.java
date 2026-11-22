import java.util.HashMap;
import java.util.Map;

class Solution {
    public int fewKinds(int[] jars, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        int longest = 0;
        int left = 0;
        for (int right = 0; right < jars.length; right++) {
            counts.merge(jars[right], 1, Integer::sum);
            // The map holds only kinds still in the window, so its size is the kinds
            while (counts.size() > k) {
                int leaving = counts.merge(jars[left], -1, Integer::sum);
                if (leaving == 0) {
                    counts.remove(jars[left]);
                }
                left++;
            }
            longest = Math.max(longest, right - left + 1);
        }
        return longest;
    }
}
