import java.util.Arrays;

class Solution {
    public boolean hasEndlessBonus(int n, int[][] doors, int start) {
        // coins[room] is the least the player has paid to reach that room so far
        int[] coins = new int[n];
        Arrays.fill(coins, Integer.MAX_VALUE);
        coins[start] = 0;
        // n - 1 rounds settle every cheapest path, unless a loop keeps paying
        for (int round = 1; round < n; round++) {
            boolean changed = false;
            for (int[] door : doors) {
                int from = door[0];
                // A room the player can't reach yet can't make anything cheaper, and MAX_VALUE plus a toll would overflow
                if (coins[from] != Integer.MAX_VALUE && coins[from] + door[2] < coins[door[1]]) {
                    coins[door[1]] = coins[from] + door[2];
                    changed = true;
                }
            }
            // Nothing moved, so nothing ever will, and no paying loop is in reach
            if (!changed) return false;
        }
        // One more round: a room that still gets cheaper is fed by a paying loop
        for (int[] door : doors) {
            int from = door[0];
            if (coins[from] != Integer.MAX_VALUE && coins[from] + door[2] < coins[door[1]]) return true;
        }
        return false;
    }
}
