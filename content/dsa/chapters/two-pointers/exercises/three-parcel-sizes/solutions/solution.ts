export function sortBySize(parcels: number[]): void {
  let low = 0;
  let mid = 0;
  let high = parcels.length - 1;
  while (mid <= high) {
    if (parcels[mid] === 0) {
      [parcels[low], parcels[mid]] = [parcels[mid], parcels[low]];
      low++;
      mid++;
    } else if (parcels[mid] === 2) {
      [parcels[mid], parcels[high]] = [parcels[high], parcels[mid]];
      // The parcel that came from the back hasn't been checked yet
      high--;
    } else {
      mid++;
    }
  }
}
