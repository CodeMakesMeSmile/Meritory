// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    public int meetingHub(TreeNode hubs, int a, int b) {
        TreeNode node = hubs;
        while (node != null) {
            // Both routes go the same way from here, so the split is further down
            if (a < node.val && b < node.val) node = node.left;
            else if (a > node.val && b > node.val) node = node.right;
            else return node.val;
        }
        return -1;
    }
}
