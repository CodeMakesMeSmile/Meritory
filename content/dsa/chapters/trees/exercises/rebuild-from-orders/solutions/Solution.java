import java.util.HashMap;
import java.util.Map;

// The runner defines TreeNode, with int val, TreeNode left, TreeNode right, and a TreeNode(int val) constructor
class Solution {
    private int next;
    private Map<Integer, Integer> where;
    private int[] preorder;

    public TreeNode rebuildTree(int[] preorder, int[] inorder) {
        this.preorder = preorder;
        this.next = 0;
        this.where = new HashMap<>();
        for (int i = 0; i < inorder.length; i++) {
            where.put(inorder[i], i);
        }
        return build(0, inorder.length);
    }

    // Builds the subtree whose joints sit in inorder from lo up to but not including hi
    private TreeNode build(int lo, int hi) {
        if (lo >= hi) return null;
        int value = preorder[next++];
        int at = where.get(value);
        TreeNode node = new TreeNode(value);
        // Preorder lists the whole left branch before the right, so build the left first
        node.left = build(lo, at);
        node.right = build(at + 1, hi);
        return node;
    }
}
