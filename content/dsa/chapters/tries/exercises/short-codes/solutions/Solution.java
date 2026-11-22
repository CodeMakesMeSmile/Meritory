import java.util.ArrayList;
import java.util.List;

class Solution {
    private static class TrieNode {
        // children[letter - 'a'] is the child for that letter, or null
        final TrieNode[] children = new TrieNode[26];
        // How many items start with the prefix this node stands for
        int passing;
    }

    public List<String> shortCodes(String[] items) {
        TrieNode root = new TrieNode();
        for (String item : items) {
            TrieNode node = root;
            for (int i = 0; i < item.length(); i++) {
                int slot = item.charAt(i) - 'a';
                if (node.children[slot] == null) node.children[slot] = new TrieNode();
                node = node.children[slot];
                node.passing++;
            }
        }
        List<String> codes = new ArrayList<>();
        for (String item : items) codes.add(code(root, item));
        return codes;
    }

    // The code ends at the first node on the item's path that only this item passes through
    private String code(TrieNode root, String item) {
        TrieNode node = root;
        for (int i = 0; i < item.length(); i++) {
            node = node.children[item.charAt(i) - 'a'];
            if (node.passing == 1) return item.substring(0, i + 1);
        }
        return item;
    }
}
