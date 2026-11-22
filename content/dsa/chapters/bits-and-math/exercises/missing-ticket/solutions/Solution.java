class Solution {
    public int missingTicket(int[] tickets) {
        // Each number but the missing one shows up as an index or n and again as a ticket, so XOR cancels it
        int missing = tickets.length;
        for (int i = 0; i < tickets.length; i++) {
            missing ^= i ^ tickets[i];
        }
        return missing;
    }
}
