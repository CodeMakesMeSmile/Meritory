import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

class Solution {
    public List<List<String>> shiftGroups(String[] codes) {
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String code : codes) {
            // The gaps between neighbouring letters survive any shift
            StringBuilder key = new StringBuilder();
            for (int i = 1; i < code.length(); i++) {
                key.append((char) ('a' + (code.charAt(i) - code.charAt(i - 1) + 26) % 26));
            }
            groups.computeIfAbsent(key.toString(), k -> new ArrayList<>()).add(code);
        }
        return new ArrayList<>(groups.values());
    }
}
