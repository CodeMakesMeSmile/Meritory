class Solution {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // True when a stem ends at this node
        boolean isStem;
    }

    public String shortenWords(String[] stems, String sentence) {
        TrieNode root = new TrieNode();
        for (String stem : stems) {
            TrieNode node = root;
            for (int i = 0; i < stem.length(); i++) {
                int slot = stem.charAt(i) - 'a';
                if (node.children[slot] == null) node.children[slot] = new TrieNode();
                node = node.children[slot];
            }
            node.isStem = true;
        }
        StringBuilder out = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (out.length() > 0) out.append(' ');
            out.append(shorten(root, word));
        }
        return out.toString();
    }

    // Walks down the word and stops at the first stem, which is the shortest
    private String shorten(TrieNode root, String word) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            node = node.children[word.charAt(i) - 'a'];
            if (node == null) return word;
            if (node.isStem) return word.substring(0, i + 1);
        }
        return word;
    }
}
