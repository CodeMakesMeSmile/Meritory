// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    public boolean coinRoute(TreeNode rooms, int target) {
        return search(rooms, 0, target);
    }

    // Each call carries the gold gathered on the way down to this room
    private static boolean search(TreeNode node, int sum, int target) {
        if (node == null) return false;
        int total = sum + node.val;
        if (node.left == null && node.right == null) return total == target;
        return search(node.left, total, target) || search(node.right, total, target);
    }
}
