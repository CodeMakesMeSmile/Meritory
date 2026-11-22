// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    public int countLookouts(TreeNode stations) {
        return stations == null ? 0 : count(stations, stations.val);
    }

    // Each call carries the highest station on the way down from the base
    private static int count(TreeNode node, int highest) {
        if (node == null) return 0;
        int clear = node.val >= highest ? 1 : 0;
        int next = Math.max(highest, node.val);
        return clear + count(node.left, next) + count(node.right, next);
    }
}
