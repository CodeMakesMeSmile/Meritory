class Solution {
    public void cancelledToBack(int[] orders) {
        int write = 0;
        for (int read = 0; read < orders.length; read++) {
            if (orders[read] != 0) {
                orders[write] = orders[read];
                write++;
            }
        }
        // Every kept order is packed at the front, so the rest are cancelled
        for (int i = write; i < orders.length; i++) {
            orders[i] = 0;
        }
    }
}
