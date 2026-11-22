import java.util.ArrayList;
import java.util.List;

class Solution {
    public int longestQuiet(int[][] rooms, int opensAt, int closesAt) {
        // Every session from every room, as [start, end]
        List<int[]> sessions = new ArrayList<>();
        for (int[] room : rooms) {
            for (int k = 0; k < room.length; k += 2) {
                sessions.add(new int[] {room[k], room[k + 1]});
            }
        }
        sessions.sort((a, b) -> Integer.compare(a[0], b[0]));
        int longest = 0;
        // No room is in use from here until the next session starts
        int quiet = opensAt;
        for (int[] session : sessions) {
            if (session[0] > quiet) longest = Math.max(longest, Math.min(session[0], closesAt) - quiet);
            quiet = Math.max(quiet, session[1]);
            if (quiet >= closesAt) break;
        }
        if (quiet < closesAt) longest = Math.max(longest, closesAt - quiet);
        return longest;
    }
}
