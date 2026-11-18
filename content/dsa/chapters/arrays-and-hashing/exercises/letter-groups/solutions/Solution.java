import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

class Solution {
    public List<List<String>> letterGroups(String[] words) {
        // LinkedHashMap keeps groups in the order their first word was added
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String word : words) {
            char[] letters = word.toCharArray();
            Arrays.sort(letters);
            groups.computeIfAbsent(new String(letters), key -> new ArrayList<>()).add(word);
        }
        return new ArrayList<>(groups.values());
    }
}
