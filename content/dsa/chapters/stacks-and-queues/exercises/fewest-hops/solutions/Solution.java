import java.util.Arrays;

class Solution {
    public int fewestHops(int[] stones) {
        int last = stones.length - 1;
        // hops[i] stays -1 until stone i is first reached, which is by the fewest hops
        int[] hops = new int[stones.length];
        Arrays.fill(hops, -1);
        hops[0] = 0;
        // Each stone joins the queue at most once, so n slots are enough
        int[] queue = new int[stones.length];
        int head = 0;
        int tail = 0;
        queue[tail++] = 0;
        while (head < tail) {
            int at = queue[head++];
            if (at == last) return hops[at];
            int[] moves = {at + stones[at], at - stones[at]};
            for (int next : moves) {
                if (next >= 0 && next <= last && hops[next] == -1) {
                    hops[next] = hops[at] + 1;
                    queue[tail++] = next;
                }
            }
        }
        return -1;
    }
}
