import java.util.Arrays;

class Solution {
    public int mostPotted(int[] seedlings, int[] pots) {
        int[] needs = seedlings.clone();
        int[] sizes = pots.clone();
        Arrays.sort(needs);
        Arrays.sort(sizes);
        int potted = 0;
        for (int size : sizes) {
            // The smallest seedling still waiting takes the smallest pot that fits it
            if (potted < needs.length && size >= needs[potted]) potted++;
        }
        return potted;
    }
}
