import java.util.Arrays;

class Solution {
    public long leastWalking(int[] runners, int[] lockers) {
        int[] people = runners.clone();
        int[] spots = lockers.clone();
        Arrays.sort(people);
        Arrays.sort(spots);
        long total = 0;
        // Two walks that cross can always be uncrossed without adding distance, so pair in order
        for (int i = 0; i < people.length; i++) {
            total += Math.abs((long) people[i] - spots[i]);
        }
        return total;
    }
}
