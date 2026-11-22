import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public int[][] ratingPairs(int[] ratings, int target) {
        int[] sorted = ratings.clone();
        Arrays.sort(sorted);
        List<int[]> pairs = new ArrayList<>();
        int left = 0;
        int right = sorted.length - 1;
        while (left < right) {
            int sum = sorted[left] + sorted[right];
            if (sum < target) {
                left++;
            } else if (sum > target) {
                right--;
            } else {
                pairs.add(new int[] {sorted[left], sorted[right]});
                left++;
                right--;
                // Copies of the rating just used would make the same pair again
                while (left < right && sorted[left] == sorted[left - 1]) {
                    left++;
                }
            }
        }
        return pairs.toArray(new int[0][]);
    }
}
