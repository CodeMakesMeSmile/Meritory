import java.util.Arrays;

class Solution {
    public int fewestCanoes(int[] weights, int limit) {
        int[] sorted = weights.clone();
        Arrays.sort(sorted);
        int light = 0;
        int heavy = sorted.length - 1;
        int canoes = 0;
        while (light <= heavy) {
            // The heaviest camper needs a canoe, and if anyone fits with them, the lightest does
            if (sorted[light] + sorted[heavy] <= limit) light++;
            heavy--;
            canoes++;
        }
        return canoes;
    }
}
