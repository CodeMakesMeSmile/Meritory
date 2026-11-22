import java.util.HashSet;
import java.util.Set;

class Solution {
    public boolean canSplit(String text, String[] words) {
        Set<String> dictionary = new HashSet<>();
        int longest = 0;
        for (String word : words) {
            dictionary.add(word);
            longest = Math.max(longest, word.length());
        }
        // ok[i] says whether the first i letters split into words
        boolean[] ok = new boolean[text.length() + 1];
        ok[0] = true;
        for (int i = 1; i <= text.length(); i++) {
            // The last word starts at j, and no word is longer than the longest
            for (int j = Math.max(0, i - longest); j < i && !ok[i]; j++) {
                ok[i] = ok[j] && dictionary.contains(text.substring(j, i));
            }
        }
        return ok[text.length()];
    }
}
