import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

class Solution {
    public int rumourReach(int n, int[][] tells, int start) {
        // News only goes one way, so each pair is listed under the teller alone
        List<List<Integer>> tellsTo = new ArrayList<>();
        for (int i = 0; i < n; i++) tellsTo.add(new ArrayList<>());
        for (int[] pair : tells) tellsTo.get(pair[0]).add(pair[1]);
        boolean[] heard = new boolean[n];
        heard[start] = true;
        int count = 1;
        // Our own stack instead of recursion, since the news can pass along a chain of everyone
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(start);
        while (!stack.isEmpty()) {
            int at = stack.pop();
            for (int next : tellsTo.get(at)) {
                if (!heard[next]) {
                    heard[next] = true;
                    count++;
                    stack.push(next);
                }
            }
        }
        return count;
    }
}
