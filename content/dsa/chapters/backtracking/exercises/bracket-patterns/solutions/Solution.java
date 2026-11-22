import java.util.ArrayList;
import java.util.List;

class Solution {
    public List<String> bracketPatterns(int pairs) {
        List<String> patterns = new ArrayList<>();
        build(pairs, 0, 0, new StringBuilder(), patterns);
        return patterns;
    }

    private void build(int pairs, int open, int closed, StringBuilder path, List<String> patterns) {
        if (closed == pairs) {
            patterns.add(path.toString());
            return;
        }
        // Open another pair only while some are left to open
        if (open < pairs) {
            path.append('(');
            build(pairs, open + 1, closed, path, patterns);
            path.deleteCharAt(path.length() - 1);
        }
        // Close only when something is open, so the string never goes wrong
        if (closed < open) {
            path.append(')');
            build(pairs, open, closed + 1, path, patterns);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
