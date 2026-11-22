class Solution {
    public int loneSock(int[] socks) {
        // Each pair XORs to 0, so only the lone pattern is left
        int lone = 0;
        for (int sock : socks) {
            lone ^= sock;
        }
        return lone;
    }
}
