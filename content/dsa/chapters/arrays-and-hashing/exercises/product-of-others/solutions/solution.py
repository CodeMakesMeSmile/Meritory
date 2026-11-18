class Solution:
    def productOfOthers(self, nums: list[int]) -> list[int]:
        products = [1] * len(nums)
        left = 1
        for i, num in enumerate(nums):
            products[i] = left
            left *= num
        right = 1
        for i in range(len(nums) - 1, -1, -1):
            products[i] *= right
            right *= nums[i]
        return products
