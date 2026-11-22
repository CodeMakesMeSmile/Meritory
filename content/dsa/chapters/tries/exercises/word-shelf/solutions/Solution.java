class WordShelf {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // True when an added word ends at this node
        boolean isWord;
    }

    private final TrieNode root = new TrieNode();

    public void add(String word) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            int slot = word.charAt(i) - 'a';
            if (node.children[slot] == null) node.children[slot] = new TrieNode();
            node = node.children[slot];
        }
        node.isWord = true;
    }

    public boolean has(String word) {
        // The path existing isn't enough, a word must end here
        TrieNode node = walk(word);
        return node != null && node.isWord;
    }

    public boolean hasPrefix(String prefix) {
        return walk(prefix) != null;
    }

    // Follows the letters from the root, or returns null if the path stops
    private TrieNode walk(String text) {
        TrieNode node = root;
        for (int i = 0; i < text.length() && node != null; i++) {
            node = node.children[text.charAt(i) - 'a'];
        }
        return node;
    }
}
