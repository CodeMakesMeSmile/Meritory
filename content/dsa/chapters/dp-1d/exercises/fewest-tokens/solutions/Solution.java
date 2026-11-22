import java.util.Arrays;

class Solution {
    public int fewestTokens(int[] tokens, int fare) {
        // No answer uses more than fare tokens, so fare + 1 stands for none
        int none = fare + 1;
        // fewest[a] is the fewest tokens that make exactly a
        int[] fewest = new int[fare + 1];
        Arrays.fill(fewest, none);
        fewest[0] = 0;
        for (int a = 1; a <= fare; a++) {
            for (int token : tokens) {
                // The last token could be any value that fits
                if (token <= a) fewest[a] = Math.min(fewest[a], fewest[a - token] + 1);
            }
        }
        return fewest[fare] == none ? -1 : fewest[fare];
    }
}
