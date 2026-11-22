class Solution {
    public String sharedStart(String[] names) {
        String first = names[0];
        // Check one column at a time, and stop where a name runs out or a letter differs
        for (int at = 0; at < first.length(); at++) {
            for (String name : names) {
                if (at == name.length() || name.charAt(at) != first.charAt(at)) {
                    return first.substring(0, at);
                }
            }
        }
        return first;
    }
}
