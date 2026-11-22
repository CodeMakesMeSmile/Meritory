class Solution {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // How many words start with the prefix this node stands for
        int passing;
    }

    public int[] prefixScores(String[] words) {
        TrieNode root = new TrieNode();
        for (String word : words) {
            TrieNode node = root;
            for (int i = 0; i < word.length(); i++) {
                int slot = word.charAt(i) - 'a';
                if (node.children[slot] == null) node.children[slot] = new TrieNode();
                node = node.children[slot];
                node.passing++;
            }
        }
        // A word's score adds up the counts on its own path
        int[] scores = new int[words.length];
        for (int k = 0; k < words.length; k++) {
            TrieNode node = root;
            for (int i = 0; i < words[k].length(); i++) {
                node = node.children[words[k].charAt(i) - 'a'];
                scores[k] += node.passing;
            }
        }
        return scores;
    }
}
