import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] pricePair(int[] prices, int target) {
        Map<Integer, Integer> firstSeen = new HashMap<>();
        for (int j = 0; j < prices.length; j++) {
            Integer partner = firstSeen.get(target - prices[j]);
            if (partner != null) {
                return new int[] {partner, j};
            }
            firstSeen.putIfAbsent(prices[j], j);
        }
        return new int[0];
    }
}
