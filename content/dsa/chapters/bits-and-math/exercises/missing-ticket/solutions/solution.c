int missingTicket(int* tickets, int ticketsSize) {
    // Each number but the missing one shows up as an index or n and again as a ticket, so XOR cancels it
    int missing = ticketsSize;
    for (int i = 0; i < ticketsSize; i++) missing ^= i ^ tickets[i];
    return missing;
}
