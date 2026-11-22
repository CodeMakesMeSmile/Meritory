import java.util.ArrayList;
import java.util.List;

class Solution {
    public List<List<String>> mirrorSplits(String word) {
        List<List<String>> ways = new ArrayList<>();
        build(word, 0, new ArrayList<>(), ways);
        return ways;
    }

    private void build(String word, int start, List<String> path, List<List<String>> ways) {
        if (start == word.length()) {
            ways.add(new ArrayList<>(path));
            return;
        }
        for (int end = start; end < word.length(); end++) {
            // A piece that doesn't mirror can't be part of any answer
            if (!readsBothWays(word, start, end)) continue;
            path.add(word.substring(start, end + 1));
            build(word, end + 1, path, ways);
            path.remove(path.size() - 1);
        }
    }

    private boolean readsBothWays(String word, int from, int to) {
        for (int i = from, j = to; i < j; i++, j--) {
            if (word.charAt(i) != word.charAt(j)) return false;
        }
        return true;
    }
}
