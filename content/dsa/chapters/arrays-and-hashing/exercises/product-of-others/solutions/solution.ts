export function productOfOthers(nums: number[]): number[] {
  const products = new Array<number>(nums.length);
  let left = 1;
  for (let i = 0; i < nums.length; i++) {
    products[i] = left;
    left *= nums[i];
  }
  let right = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    // Adding 0 turns -0 into 0
    products[i] = products[i] * right + 0;
    right *= nums[i];
  }
  return products;
}
