class Solution {
    public boolean canSplitEvenly(int[] parcels) {
        int total = 0;
        for (int weight : parcels) total += weight;
        // Two equal whole totals can't add up to an odd number
        if (total % 2 == 1) return false;
        int half = total / 2;
        // reachable[w] says whether some of the parcels so far weigh exactly w
        boolean[] reachable = new boolean[half + 1];
        reachable[0] = true;
        for (int weight : parcels) {
            // Going down keeps reachable[w - weight] from before this parcel, so it's used once
            for (int w = half; w >= weight; w--) {
                if (reachable[w - weight]) reachable[w] = true;
            }
        }
        return reachable[half];
    }
}
