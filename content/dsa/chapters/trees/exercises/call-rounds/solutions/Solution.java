import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

// The runner defines TreeNode, with int val, TreeNode left, and TreeNode right
class Solution {
    public int[][] callRounds(TreeNode tree) {
        List<int[]> rounds = new ArrayList<>();
        Queue<TreeNode> queue = new ArrayDeque<>();
        if (tree != null) queue.offer(tree);
        while (!queue.isEmpty()) {
            // The queue holds exactly one round right now
            int size = queue.size();
            int[] round = new int[size];
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                round[i] = node.val;
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            rounds.add(round);
        }
        return rounds.toArray(new int[0][]);
    }
}
