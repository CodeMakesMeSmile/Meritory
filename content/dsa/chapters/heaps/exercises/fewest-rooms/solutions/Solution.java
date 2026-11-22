import java.util.Arrays;
import java.util.PriorityQueue;

class Solution {
    public int fewestRooms(int[][] sessions) {
        int[][] byStart = sessions.clone();
        Arrays.sort(byStart, (a, b) -> Integer.compare(a[0], b[0]));
        // The end time of each room's current session, with the soonest free room on top
        PriorityQueue<Integer> rooms = new PriorityQueue<>();
        for (int[] session : byStart) {
            // Reuse the room that frees up first, if it's free by the time this starts
            if (!rooms.isEmpty() && rooms.peek() <= session[0]) rooms.poll();
            rooms.offer(session[1]);
        }
        // A room is only ever reused, never given back, so the heap's size is the answer
        return rooms.size();
    }
}
