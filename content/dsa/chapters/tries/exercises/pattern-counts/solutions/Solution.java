class Solution {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // True when a word ends at this node
        boolean isWord;
    }

    public int[] countFits(String[] words, String[] patterns) {
        TrieNode root = new TrieNode();
        for (String word : words) {
            TrieNode node = root;
            for (int i = 0; i < word.length(); i++) {
                int slot = word.charAt(i) - 'a';
                if (node.children[slot] == null) node.children[slot] = new TrieNode();
                node = node.children[slot];
            }
            node.isWord = true;
        }
        int[] counts = new int[patterns.length];
        for (int k = 0; k < patterns.length; k++) {
            counts[k] = count(root, patterns[k], 0);
        }
        return counts;
    }

    // Counts the words below node that fit the pattern from position at on
    private int count(TrieNode node, String pattern, int at) {
        if (at == pattern.length()) return node.isWord ? 1 : 0;
        char letter = pattern.charAt(at);
        if (letter != '.') {
            TrieNode next = node.children[letter - 'a'];
            return next == null ? 0 : count(next, pattern, at + 1);
        }
        // An empty square could be any letter, so add up every child's count
        int total = 0;
        for (TrieNode child : node.children) {
            if (child != null) total += count(child, pattern, at + 1);
        }
        return total;
    }
}
