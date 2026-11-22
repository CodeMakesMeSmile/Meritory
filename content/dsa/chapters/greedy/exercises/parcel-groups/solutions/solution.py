class Solution:
    def groupSizes(self, labels: str) -> list[int]:
        # Where each van's last parcel sits
        last = {label: i for i, label in enumerate(labels)}
        sizes = []
        group_start = 0
        group_end = 0
        for i, label in enumerate(labels):
            # The group has to reach this van's last parcel
            group_end = max(group_end, last[label])
            # Every van in the group is finished here, so cut as early as possible
            if i == group_end:
                sizes.append(i - group_start + 1)
                group_start = i + 1
        return sizes
