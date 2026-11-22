import java.util.Arrays;

class Solution {
    public int peakLoad(int[][] appliances) {
        int[][] events = new int[appliances.length * 2][];
        for (int i = 0; i < appliances.length; i++) {
            int[] appliance = appliances[i];
            // Drawing through minute off is the same as stopping as minute off + 1 starts
            events[2 * i] = new int[] {appliance[0], appliance[2]};
            events[2 * i + 1] = new int[] {appliance[1] + 1, -appliance[2]};
        }
        // At the same minute, switching off comes first
        Arrays.sort(events, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        int load = 0;
        int peak = 0;
        for (int[] event : events) {
            load += event[1];
            peak = Math.max(peak, load);
        }
        return peak;
    }
}
