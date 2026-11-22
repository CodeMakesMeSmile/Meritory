import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
    public List<String> suggestNames(String[] names, String prefix, int k) {
        String[] sorted = names.clone();
        Arrays.sort(sorted);
        // Binary search for the first name that's at least the prefix
        int low = 0;
        int high = sorted.length;
        while (low < high) {
            int middle = (low + high) >>> 1;
            if (sorted[middle].compareTo(prefix) < 0) low = middle + 1;
            else high = middle;
        }
        // Every name that starts with the prefix sits in one run from there
        List<String> found = new ArrayList<>();
        for (int i = low; i < sorted.length && found.size() < k; i++) {
            if (!sorted[i].startsWith(prefix)) break;
            found.add(sorted[i]);
        }
        return found;
    }
}
