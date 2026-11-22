import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[] groupSizes(String labels) {
        // Where each van's last parcel sits
        int[] last = new int[26];
        for (int i = 0; i < labels.length(); i++) {
            last[labels.charAt(i) - 'a'] = i;
        }
        List<Integer> sizes = new ArrayList<>();
        int groupStart = 0;
        int groupEnd = 0;
        for (int i = 0; i < labels.length(); i++) {
            // The group has to reach this van's last parcel
            groupEnd = Math.max(groupEnd, last[labels.charAt(i) - 'a']);
            // Every van in the group is finished here, so cut as early as possible
            if (i == groupEnd) {
                sizes.add(i - groupStart + 1);
                groupStart = i + 1;
            }
        }
        int[] answer = new int[sizes.size()];
        for (int i = 0; i < answer.length; i++) answer[i] = sizes.get(i);
        return answer;
    }
}
