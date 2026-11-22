class Solution:
    def mostNested(self, boxes: list[list[int]]) -> int:
        # Width going up, and for equal widths, height going down, so equal widths can't both be picked
        ordered = sorted(boxes, key=lambda box: (box[0], -box[1]))
        # tails[k] is the lowest height that can end a stack of k + 1 boxes
        tails = []
        for _, height in ordered:
            lo, hi = 0, len(tails)
            while lo < hi:
                mid = lo + (hi - lo) // 2
                if tails[mid] >= height:
                    hi = mid
                else:
                    lo = mid + 1
            if lo == len(tails):
                tails.append(height)
            else:
                tails[lo] = height
        return len(tails)
