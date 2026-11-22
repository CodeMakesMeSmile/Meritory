class Solution {
    public int fewestDays(int[] savings, int goal) {
        int fewest = 0;
        int total = 0;
        int left = 0;
        for (int right = 0; right < savings.length; right++) {
            total += savings[right];
            // Record while the window still reaches the goal, then try a shorter one
            while (total >= goal) {
                int length = right - left + 1;
                if (fewest == 0 || length < fewest) {
                    fewest = length;
                }
                total -= savings[left];
                left++;
            }
        }
        return fewest;
    }
}
