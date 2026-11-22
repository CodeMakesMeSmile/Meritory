// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    public int commonLead(TreeNode team, int a, int b) {
        return lowest(team, a, b).val;
    }

    // Returns a, b, or their closest shared lead, whichever this branch turns up, or null
    private static TreeNode lowest(TreeNode node, int a, int b) {
        if (node == null || node.val == a || node.val == b) return node;
        TreeNode left = lowest(node.left, a, b);
        TreeNode right = lowest(node.right, a, b);
        // One found on each side means their paths split here
        if (left != null && right != null) return node;
        return left != null ? left : right;
    }
}
