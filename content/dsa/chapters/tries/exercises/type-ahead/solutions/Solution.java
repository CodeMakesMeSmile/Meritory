import java.util.ArrayList;
import java.util.List;

class Solution {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, so they're in letter order
        final TrieNode[] children = new TrieNode[26];
        // The product that ends at this node, if any
        String name;
    }

    public List<List<String>> typeAhead(String[] products, String typed, int k) {
        TrieNode root = new TrieNode();
        for (String product : products) {
            TrieNode node = root;
            for (int i = 0; i < product.length(); i++) {
                int slot = product.charAt(i) - 'a';
                if (node.children[slot] == null) node.children[slot] = new TrieNode();
                node = node.children[slot];
            }
            node.name = product;
        }
        List<List<String>> suggestions = new ArrayList<>();
        TrieNode node = root;
        for (int i = 0; i < typed.length(); i++) {
            // Once the walk falls off the trie, nothing typed after can match
            node = node == null ? null : node.children[typed.charAt(i) - 'a'];
            List<String> found = new ArrayList<>();
            if (node != null) collect(node, k, found);
            suggestions.add(found);
        }
        return suggestions;
    }

    // A node's own name comes before every longer name below it, then children go a to z
    private void collect(TrieNode node, int k, List<String> found) {
        if (found.size() == k) return;
        if (node.name != null) found.add(node.name);
        for (TrieNode child : node.children) {
            if (child != null) collect(child, k, found);
        }
    }
}
