class Solution {
    public boolean canMerge(String first, String second, String tape) {
        int n = first.length();
        int m = second.length();
        if (tape.length() != n + m) return false;
        // fits[j] says whether the first i letters of first and the first j of second make the tape's first i + j
        boolean[] fits = new boolean[m + 1];
        for (int i = 0; i <= n; i++) {
            for (int j = 0; j <= m; j++) {
                if (i == 0 && j == 0) {
                    fits[0] = true;
                    continue;
                }
                char letter = tape.charAt(i + j - 1);
                // Before this update, fits[j] is still the answer with one less letter of first
                boolean fromFirst = i > 0 && fits[j] && first.charAt(i - 1) == letter;
                // fits[j - 1] is already this row's, the answer with one less letter of second
                boolean fromSecond = j > 0 && fits[j - 1] && second.charAt(j - 1) == letter;
                fits[j] = fromFirst || fromSecond;
            }
        }
        return fits[m];
    }
}
