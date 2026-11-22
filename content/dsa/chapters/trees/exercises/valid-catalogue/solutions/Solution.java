// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    public boolean isSearchTree(TreeNode index) {
        // 64-bit limits sit outside every 32-bit number, so they never reject a real one
        return valid(index, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    // Every number in this branch must be strictly between low and high
    private static boolean valid(TreeNode node, long low, long high) {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;
        return valid(node.left, low, node.val) && valid(node.right, node.val, high);
    }
}
