import java.util.HashMap;
import java.util.Map;

class Solution {
    public int noSongTwice(int[] songs) {
        Map<Integer, Integer> lastSeen = new HashMap<>();
        int longest = 0;
        int left = 0;
        for (int right = 0; right < songs.length; right++) {
            Integer last = lastSeen.get(songs[right]);
            // A last play from before the window isn't a repeat, so left never moves back
            if (last != null) {
                left = Math.max(left, last + 1);
            }
            lastSeen.put(songs[right], right);
            longest = Math.max(longest, right - left + 1);
        }
        return longest;
    }
}
