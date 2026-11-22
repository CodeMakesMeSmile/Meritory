import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[] freeOnBoth(int[] first, int[] second) {
        List<Integer> shared = new ArrayList<>();
        int i = 0;
        int j = 0;
        while (i < first.length && j < second.length) {
            if (first[i] < second[j]) {
                i++;
            } else if (first[i] > second[j]) {
                j++;
            } else {
                // Repeats sit side by side, so only add a day the answer doesn't end with
                if (shared.isEmpty() || shared.get(shared.size() - 1) != first[i]) {
                    shared.add(first[i]);
                }
                i++;
                j++;
            }
        }
        int[] days = new int[shared.size()];
        for (int k = 0; k < days.length; k++) {
            days[k] = shared.get(k);
        }
        return days;
    }
}
