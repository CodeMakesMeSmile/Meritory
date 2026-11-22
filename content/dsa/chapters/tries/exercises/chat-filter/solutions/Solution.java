import java.util.ArrayList;
import java.util.List;

class Solution {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // The flagged word that ends at this node, until it's found
        String word;
    }

    public List<String> flaggedWords(String message, String[] words) {
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
        List<String> found = new ArrayList<>();
        for (int start = 0; start < message.length(); start++) {
            // Walk down the trie while the letters match, and a space ends the walk
            TrieNode node = root;
            for (int at = start; at < message.length(); at++) {
                char letter = message.charAt(at);
                if (letter == ' ') break;
                node = node.children[letter - 'a'];
                if (node == null) break;
                if (node.word != null) {
                    found.add(node.word);
                    // Clearing it means a word seen twice is reported once
                    node.word = null;
                }
            }
        }
        return found;
    }
}
