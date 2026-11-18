class Solution {
    public boolean enoughTiles(String word, String tiles) {
        int[] counts = new int[26];
        for (int i = 0; i < tiles.length(); i++) {
            counts[tiles.charAt(i) - 'a']++;
        }
        for (int i = 0; i < word.length(); i++) {
            int letter = word.charAt(i) - 'a';
            if (counts[letter] == 0) {
                return false;
            }
            counts[letter]--;
        }
        return true;
    }
}
