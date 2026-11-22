class TileDictionary {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // True when a word ends at this node
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

    public boolean matches(String pattern) {
        return search(root, pattern, 0);
    }

    private boolean search(TrieNode node, String pattern, int at) {
        if (at == pattern.length()) return node.isWord;
        char letter = pattern.charAt(at);
        if (letter != '.') {
            TrieNode next = node.children[letter - 'a'];
            return next != null && search(next, pattern, at + 1);
        }
        // A blank could be any letter, so try every child and stop at the first that works
        for (TrieNode child : node.children) {
            if (child != null && search(child, pattern, at + 1)) return true;
        }
        return false;
    }
}
