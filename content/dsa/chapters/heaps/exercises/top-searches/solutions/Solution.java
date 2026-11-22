import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

class Solution {
    public List<String> topSearches(String[] searches, int k) {
        Map<String, Integer> counts = new HashMap<>();
        for (String word : searches) counts.merge(word, 1, Integer::sum);
        // The weakest of the k best words sits on top: fewest searches, then last in the alphabet
        PriorityQueue<String> best = new PriorityQueue<>((a, b) -> {
            int byCount = Integer.compare(counts.get(a), counts.get(b));
            return byCount != 0 ? byCount : b.compareTo(a);
        });
        for (String word : counts.keySet()) {
            best.offer(word);
            if (best.size() > k) best.poll();
        }
        // The heap gives them up weakest first, so reverse at the end
        List<String> top = new ArrayList<>();
        while (!best.isEmpty()) top.add(best.poll());
        Collections.reverse(top);
        return top;
    }
}
