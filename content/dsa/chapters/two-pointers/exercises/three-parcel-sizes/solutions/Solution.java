class Solution {
    public void sortBySize(int[] parcels) {
        int low = 0;
        int mid = 0;
        int high = parcels.length - 1;
        while (mid <= high) {
            if (parcels[mid] == 0) {
                swap(parcels, low, mid);
                low++;
                mid++;
            } else if (parcels[mid] == 2) {
                swap(parcels, mid, high);
                // The parcel that came from the back hasn't been checked yet
                high--;
            } else {
                mid++;
            }
        }
    }

    private static void swap(int[] parcels, int a, int b) {
        int held = parcels[a];
        parcels[a] = parcels[b];
        parcels[b] = held;
    }
}
