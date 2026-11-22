class Solution {
    public int doublingNights(int start, int goal) {
        // A long, since doubling can pass the largest int on the last night
        long coins = start;
        int nights = 0;
        // Each night doubles the coins, so this runs about log(goal / start) times
        while (coins < goal) {
            coins *= 2;
            nights++;
        }
        return nights;
    }
}
