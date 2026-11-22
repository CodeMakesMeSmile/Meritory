class Solution {
    public int warmStretches(int[] temperatures, int k, int limit) {
        // An average of at least limit is a total of at least limit times k
        int needed = limit * k;
        int total = 0;
        int count = 0;
        for (int right = 0; right < temperatures.length; right++) {
            total += temperatures[right];
            if (right >= k) {
                total -= temperatures[right - k];
            }
            if (right >= k - 1 && total >= needed) {
                count++;
            }
        }
        return count;
    }
}
