class PrefixTally {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // How many saved copies pass through this node
        int passing;
        // How many saved copies end at this node
        int ending;
    }

    private final TrieNode root = new TrieNode();

    public void add(String word) {
        change(word, 1);
    }

    public void remove(String word) {
        change(word, -1);
    }

    public int countStarting(String prefix) {
        TrieNode node = walk(prefix);
        return node == null ? 0 : node.passing;
    }

    public int countExact(String word) {
        TrieNode node = walk(word);
        return node == null ? 0 : node.ending;
    }

    // Adds by to every count on the word's path, making nodes as needed
    private void change(String word, int by) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            int slot = word.charAt(i) - 'a';
            if (node.children[slot] == null) node.children[slot] = new TrieNode();
            node = node.children[slot];
            node.passing += by;
        }
        node.ending += by;
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
