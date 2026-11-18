import java.util.HashSet;
import java.util.Set;

class Solution {
    public int longestRun(int[] days) {
        Set<Integer> done = new HashSet<>();
        for (int day : days) {
            done.add(day);
        }
        int longest = 0;
        for (int day : done) {
            if (done.contains(day - 1)) {
                continue;
            }
            int length = 1;
            while (done.contains(day + length)) {
                length++;
            }
            longest = Math.max(longest, length);
        }
        return longest;
    }
}
