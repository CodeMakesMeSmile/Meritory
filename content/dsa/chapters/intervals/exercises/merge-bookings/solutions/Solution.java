import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public int[][] mergeBookings(int[][] bookings) {
        int[][] byStart = bookings.clone();
        Arrays.sort(byStart, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] booking : byStart) {
            int[] last = merged.isEmpty() ? null : merged.get(merged.size() - 1);
            // A booking that overlaps or touches the stretch so far joins it
            if (last != null && booking[0] <= last[1]) {
                last[1] = Math.max(last[1], booking[1]);
            } else {
                merged.add(new int[] {booking[0], booking[1]});
            }
        }
        return merged.toArray(new int[0][]);
    }
}
