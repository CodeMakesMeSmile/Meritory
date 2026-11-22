import java.util.HashSet;
import java.util.Set;

class Solution {
    private static final long MOD = 1_000_000_007L;

    public int splitCount(String text, String[] words) {
        Set<String> dictionary = new HashSet<>();
        int longest = 0;
        for (String word : words) {
            dictionary.add(word);
            longest = Math.max(longest, word.length());
        }
        // ways[i] counts the ways to split the first i letters into words
        long[] ways = new long[text.length() + 1];
        ways[0] = 1;
        for (int i = 1; i <= text.length(); i++) {
            // Every word that ends here adds the ways to split what comes before it
            for (int j = Math.max(0, i - longest); j < i; j++) {
                if (ways[j] > 0 && dictionary.contains(text.substring(j, i))) {
                    ways[i] = (ways[i] + ways[j]) % MOD;
                }
            }
        }
        return (int) ways[text.length()];
    }
}
