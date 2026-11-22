class Solution {
    public int cheapestRepaint(String current, String wanted, int addCost, int removeCost, int repaintCost) {
        int n = current.length();
        int m = wanted.length();
        // before[j] is the cheapest way from the first i - 1 letters of current to the first j of wanted
        int[] before = new int[m + 1];
        // From nothing, every letter of wanted is painted in
        for (int j = 0; j <= m; j++) before[j] = j * addCost;
        for (int i = 1; i <= n; i++) {
            int[] row = new int[m + 1];
            // Down to nothing, every letter of current is painted out
            row[0] = i * removeCost;
            for (int j = 1; j <= m; j++) {
                if (current.charAt(i - 1) == wanted.charAt(j - 1)) {
                    row[j] = before[j - 1];
                } else {
                    int repaint = before[j - 1] + repaintCost;
                    int remove = before[j] + removeCost;
                    int add = row[j - 1] + addCost;
                    row[j] = Math.min(repaint, Math.min(remove, add));
                }
            }
            before = row;
        }
        return before[m];
    }
}
