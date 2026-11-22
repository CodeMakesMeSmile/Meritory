class Solution {
    public String smallestWindow(String text, String needed) {
        // How many more of each letter the window needs, below 0 when it has spare
        int[] need = new int[26];
        for (char letter : needed.toCharArray()) {
            need[letter - 'a']++;
        }
        int missing = needed.length();
        int bestStart = 0;
        int bestLength = 0;
        int left = 0;
        for (int right = 0; right < text.length(); right++) {
            int entering = text.charAt(right) - 'a';
            if (need[entering] > 0) {
                missing--;
            }
            need[entering]--;
            while (missing == 0) {
                // Only a strictly shorter stretch replaces one that starts earlier
                int length = right - left + 1;
                if (bestLength == 0 || length < bestLength) {
                    bestStart = left;
                    bestLength = length;
                }
                int leaving = text.charAt(left) - 'a';
                need[leaving]++;
                if (need[leaving] > 0) {
                    missing++;
                }
                left++;
            }
        }
        return text.substring(bestStart, bestStart + bestLength);
    }
}
