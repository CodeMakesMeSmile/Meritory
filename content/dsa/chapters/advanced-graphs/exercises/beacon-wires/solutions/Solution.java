import java.util.Arrays;

class Solution {
    public int leastWire(int[][] beacons) {
        int n = beacons.length;
        boolean[] inNetwork = new boolean[n];
        // reach[i] is the shortest wire from the network to beacon i so far
        int[] reach = new int[n];
        Arrays.fill(reach, Integer.MAX_VALUE);
        reach[0] = 0;
        int total = 0;
        // Prim's algorithm with an array, since every pair of beacons is an edge
        for (int step = 0; step < n; step++) {
            // The beacon outside the network with the shortest wire to it joins next
            int pick = -1;
            for (int i = 0; i < n; i++) {
                if (!inNetwork[i] && (pick == -1 || reach[i] < reach[pick])) pick = i;
            }
            inNetwork[pick] = true;
            total += reach[pick];
            // The new beacon may offer a shorter wire to the beacons still outside
            for (int i = 0; i < n; i++) {
                if (inNetwork[i]) continue;
                int wire = Math.abs(beacons[pick][0] - beacons[i][0]) + Math.abs(beacons[pick][1] - beacons[i][1]);
                if (wire < reach[i]) reach[i] = wire;
            }
        }
        return total;
    }
}
