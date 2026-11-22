import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[] hiddenRearrangements(String text, String word) {
        int[] need = new int[26];
        int[] have = new int[26];
        for (char letter : word.toCharArray()) {
            need[letter - 'a']++;
        }
        // How many of the 26 letters have exactly the count the word needs
        int matched = 0;
        for (int count : need) {
            if (count == 0) {
                matched++;
            }
        }
        List<Integer> starts = new ArrayList<>();
        int size = word.length();
        for (int right = 0; right < text.length(); right++) {
            matched += change(have, need, text.charAt(right) - 'a', 1);
            if (right >= size) {
                matched += change(have, need, text.charAt(right - size) - 'a', -1);
            }
            if (right >= size - 1 && matched == 26) {
                starts.add(right - size + 1);
            }
        }
        return starts.stream().mapToInt(Integer::intValue).toArray();
    }

    // Moves one letter's count, and returns how the number of matched letters changes
    private static int change(int[] have, int[] need, int letter, int by) {
        int before = have[letter] == need[letter] ? 1 : 0;
        have[letter] += by;
        int after = have[letter] == need[letter] ? 1 : 0;
        return after - before;
    }
}
