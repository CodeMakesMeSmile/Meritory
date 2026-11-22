import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[][] addBooking(int[][] diary, int[] booking) {
        List<int[]> result = new ArrayList<>();
        int start = booking[0];
        int end = booking[1];
        int i = 0;
        // Busy times that end before the booking starts stay as they are
        while (i < diary.length && diary[i][1] < start) {
            result.add(new int[] {diary[i][0], diary[i][1]});
            i++;
        }
        // Every busy time that overlaps or touches the booking joins it
        while (i < diary.length && diary[i][0] <= end) {
            start = Math.min(start, diary[i][0]);
            end = Math.max(end, diary[i][1]);
            i++;
        }
        result.add(new int[] {start, end});
        // The rest start after the booking ends
        while (i < diary.length) {
            result.add(new int[] {diary[i][0], diary[i][1]});
            i++;
        }
        return result.toArray(new int[0][]);
    }
}
