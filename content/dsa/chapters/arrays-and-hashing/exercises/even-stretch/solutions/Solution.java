import java.util.HashMap;
import java.util.Map;

class Solution {
    public int evenStretch(boolean[] games) {
        // Wins minus losses so far, mapped to the first game index where it happened
        Map<Integer, Integer> firstIndex = new HashMap<>();
        firstIndex.put(0, -1);
        int balance = 0;
        int longest = 0;
        for (int i = 0; i < games.length; i++) {
            balance += games[i] ? 1 : -1;
            Integer start = firstIndex.putIfAbsent(balance, i);
            if (start != null) {
                longest = Math.max(longest, i - start);
            }
        }
        return longest;
    }
}
