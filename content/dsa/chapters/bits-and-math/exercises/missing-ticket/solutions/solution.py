class Solution:
    def missingTicket(self, tickets: list[int]) -> int:
        # Each number but the missing one shows up as an index or n and again as a ticket, so XOR cancels it
        missing = len(tickets)
        for i, ticket in enumerate(tickets):
            missing ^= i ^ ticket
        return missing
