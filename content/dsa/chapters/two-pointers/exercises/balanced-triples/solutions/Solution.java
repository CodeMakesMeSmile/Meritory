import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public int[][] balancedTriples(int[] amounts) {
        int[] sorted = amounts.clone();
        Arrays.sort(sorted);
        List<int[]> found = new ArrayList<>();
        for (int i = 0; i < sorted.length - 2; i++) {
            // A repeated first amount would find the same sets again
            if (i > 0 && sorted[i] == sorted[i - 1]) {
                continue;
            }
            int left = i + 1;
            int right = sorted.length - 1;
            while (left < right) {
                int sum = sorted[i] + sorted[left] + sorted[right];
                if (sum < 0) {
                    left++;
                } else if (sum > 0) {
                    right--;
                } else {
                    found.add(new int[] {sorted[i], sorted[left], sorted[right]});
                    left++;
                    right--;
                    while (left < right && sorted[left] == sorted[left - 1]) {
                        left++;
                    }
                }
            }
        }
        return found.toArray(new int[0][]);
    }
}
