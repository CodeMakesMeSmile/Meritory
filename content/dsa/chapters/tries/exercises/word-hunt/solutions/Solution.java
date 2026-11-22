import java.util.ArrayList;
import java.util.List;

class Solution {
    private static final int[][] STEPS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // The listed word that ends at this node, until it's found
        String word;
    }

    public List<String> wordHunt(String[] grid, String[] words) {
        TrieNode root = new TrieNode();
        for (String word : words) {
            TrieNode node = root;
            for (int i = 0; i < word.length(); i++) {
                int slot = word.charAt(i) - 'a';
                if (node.children[slot] == null) node.children[slot] = new TrieNode();
                node = node.children[slot];
            }
            node.word = word;
        }
        boolean[][] used = new boolean[grid.length][grid[0].length()];
        List<String> found = new ArrayList<>();
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length(); c++) explore(grid, used, r, c, root, found);
        }
        return found;
    }

    // Moves into cell (r, c) from the trie node for the letters so far
    private void explore(String[] grid, boolean[][] used, int r, int c, TrieNode node, List<String> found) {
        if (used[r][c]) return;
        TrieNode next = node.children[grid[r].charAt(c) - 'a'];
        // No listed word starts with these letters, so stop here
        if (next == null) return;
        if (next.word != null) {
            found.add(next.word);
            // Clearing it means a word in two places is reported once
            next.word = null;
        }
        used[r][c] = true;
        for (int[] step : STEPS) {
            int nr = r + step[0];
            int nc = c + step[1];
            if (nr >= 0 && nc >= 0 && nr < grid.length && nc < grid[0].length()) {
                explore(grid, used, nr, nc, next, found);
            }
        }
        // Clearing the mark lets other paths use this cell
        used[r][c] = false;
    }
}
