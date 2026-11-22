import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[][] teamFree(int[][] calendars, int dayStart, int dayEnd) {
        // Every busy time from every calendar, as [start, end]
        List<int[]> busy = new ArrayList<>();
        for (int[] calendar : calendars) {
            for (int k = 0; k < calendar.length; k += 2) {
                busy.add(new int[] {calendar[k], calendar[k + 1]});
            }
        }
        busy.sort((a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> gaps = new ArrayList<>();
        // Nobody is busy from here until the next busy time starts
        int freeFrom = dayStart;
        for (int[] time : busy) {
            if (time[0] > freeFrom) gaps.add(new int[] {freeFrom, Math.min(time[0], dayEnd)});
            freeFrom = Math.max(freeFrom, time[1]);
            if (freeFrom >= dayEnd) break;
        }
        if (freeFrom < dayEnd) gaps.add(new int[] {freeFrom, dayEnd});
        return gaps.toArray(new int[0][]);
    }
}
