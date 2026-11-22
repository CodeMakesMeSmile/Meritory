import java.util.ArrayList;
import java.util.List;

// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    public String packTree(TreeNode story) {
        List<String> parts = new ArrayList<>();
        write(story, parts);
        return String.join(",", parts);
    }

    private static void write(TreeNode node, List<String> parts) {
        // A marker for each missing child shows where a branch ends
        if (node == null) {
            parts.add("#");
            return;
        }
        parts.add(String.valueOf(node.val));
        write(node.left, parts);
        write(node.right, parts);
    }
}
