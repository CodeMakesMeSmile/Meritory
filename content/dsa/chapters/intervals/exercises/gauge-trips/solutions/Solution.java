import java.util.Arrays;

class Solution {
    public int fewestTrips(int[][] windows) {
        int[][] byClose = windows.clone();
        Arrays.sort(byClose, (a, b) -> Integer.compare(a[1], b[1]));
        int trips = 0;
        // The minute of the last trip, before any window opens
        int lastTrip = -1;
        for (int[] window : byClose) {
            // This window opened after the last trip, so that trip missed it
            if (window[0] > lastTrip) {
                trips++;
                // As late as this window allows, which reads every window open by then
                lastTrip = window[1];
            }
        }
        return trips;
    }
}
