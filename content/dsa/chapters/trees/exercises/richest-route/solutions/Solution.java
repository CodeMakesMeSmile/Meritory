// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    private int best;

    public int richestRoute(TreeNode mine) {
        best = mine.val;
        gain(mine);
        return best;
    }

    // Returns the best value of a route that starts here and only goes down
    private int gain(TreeNode node) {
        if (node == null) return 0;
        // A side that only costs is better left off
        int left = Math.max(0, gain(node.left));
        int right = Math.max(0, gain(node.right));
        // A route that bends here can use both sides, but a parent can only extend one
        best = Math.max(best, node.val + left + right);
        return node.val + Math.max(left, right);
    }
}
