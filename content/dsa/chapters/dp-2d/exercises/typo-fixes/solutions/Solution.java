class Solution {
    public int fewestEdits(String typed, String word) {
        int n = typed.length();
        int m = word.length();
        // edits[i][j] turns the first i letters of typed into the first j letters of word
        int[][] edits = new int[n + 1][m + 1];
        // From i letters to none is i removals, and from none to j letters is j additions
        for (int i = 0; i <= n; i++) edits[i][0] = i;
        for (int j = 0; j <= m; j++) edits[0][j] = j;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                if (typed.charAt(i - 1) == word.charAt(j - 1)) {
                    // The last letters already match, so they cost nothing
                    edits[i][j] = edits[i - 1][j - 1];
                } else {
                    // Change the last letter, remove it, or add the word's last letter
                    edits[i][j] = 1 + Math.min(edits[i - 1][j - 1], Math.min(edits[i - 1][j], edits[i][j - 1]));
                }
            }
        }
        return edits[n][m];
    }
}
