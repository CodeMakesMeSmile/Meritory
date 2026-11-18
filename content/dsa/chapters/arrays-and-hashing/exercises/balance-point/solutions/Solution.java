class Solution {
    public int balancePoint(int[] weights) {
        int right = 0;
        for (int weight : weights) {
            right += weight;
        }
        int left = 0;
        for (int i = 0; i < weights.length; i++) {
            right -= weights[i];
            if (left == right) {
                return i;
            }
            left += weights[i];
        }
        return -1;
    }
}
