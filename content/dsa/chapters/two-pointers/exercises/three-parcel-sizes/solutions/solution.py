class Solution:
    def sortBySize(self, parcels: list[int]) -> None:
        low = mid = 0
        high = len(parcels) - 1
        while mid <= high:
            if parcels[mid] == 0:
                parcels[low], parcels[mid] = parcels[mid], parcels[low]
                low += 1
                mid += 1
            elif parcels[mid] == 2:
                parcels[mid], parcels[high] = parcels[high], parcels[mid]
                # The parcel that came from the back hasn't been checked yet
                high -= 1
            else:
                mid += 1
