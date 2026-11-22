class Solution {
    public int rainBetweenWalls(int[] walls) {
        int water = 0;
        int left = 0;
        int right = walls.length - 1;
        int tallestLeft = 0;
        int tallestRight = 0;
        while (left < right) {
            tallestLeft = Math.max(tallestLeft, walls[left]);
            tallestRight = Math.max(tallestRight, walls[right]);
            // The other side already has a taller wall, so the lower one sets the level
            if (tallestLeft < tallestRight) {
                water += tallestLeft - walls[left];
                left++;
            } else {
                water += tallestRight - walls[right];
                right--;
            }
        }
        return water;
    }
}
