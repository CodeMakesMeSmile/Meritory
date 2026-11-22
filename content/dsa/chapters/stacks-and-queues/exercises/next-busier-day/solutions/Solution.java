class Solution {
    public int[] daysUntilBusier(int[] visitors) {
        int[] wait = new int[visitors.length];
        // Days still waiting for a busier one, with counts that never rise from bottom to top
        int[] waiting = new int[visitors.length];
        int top = 0;
        for (int day = 0; day < visitors.length; day++) {
            while (top > 0 && visitors[waiting[top - 1]] < visitors[day]) {
                int earlier = waiting[--top];
                wait[earlier] = day - earlier;
            }
            waiting[top++] = day;
        }
        return wait;
    }
}
