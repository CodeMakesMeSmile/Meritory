import java.util.ArrayList;
import java.util.List;

class Solution {
    public int fewestTerms(int n, int[][] prerequisites) {
        List<List<Integer>> unlocks = new ArrayList<>();
        for (int i = 0; i < n; i++) unlocks.add(new ArrayList<>());
        // waiting[m] counts the prerequisites module m hasn't had passed yet
        int[] waiting = new int[n];
        for (int[] pair : prerequisites) {
            unlocks.get(pair[0]).add(pair[1]);
            waiting[pair[1]]++;
        }
        // The first term holds every module with nothing to wait for
        List<Integer> term = new ArrayList<>();
        for (int m = 0; m < n; m++) if (waiting[m] == 0) term.add(m);
        int terms = 0;
        int taken = 0;
        while (!term.isEmpty()) {
            terms++;
            taken += term.size();
            List<Integer> nextTerm = new ArrayList<>();
            for (int m : term) {
                for (int after : unlocks.get(m)) {
                    waiting[after]--;
                    if (waiting[after] == 0) nextTerm.add(after);
                }
            }
            term = nextTerm;
        }
        // Modules in a circle never get down to 0 waiting, so they're never taken
        return taken == n ? terms : -1;
    }
}
