class Solution {
    public int[] fillTheBreak(int[] lengths, int target) {
        int left = 0;
        int right = lengths.length - 1;
        while (left < right) {
            int sum = lengths[left] + lengths[right];
            if (sum == target) {
                return new int[] {left, right};
            }
            // A short total means no partner still in play is long enough for the left song
            if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return new int[0];
    }
}
