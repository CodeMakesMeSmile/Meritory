import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    public int[] seenFromEast(TreeNode lanterns) {
        List<Integer> seen = new ArrayList<>();
        Queue<TreeNode> queue = new ArrayDeque<>();
        if (lanterns != null) queue.offer(lanterns);
        while (!queue.isEmpty()) {
            // The queue holds exactly one level right now
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                // The last lantern taken from a level is the one furthest east
                if (i == size - 1) seen.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
        }
        return seen.stream().mapToInt(Integer::intValue).toArray();
    }
}
