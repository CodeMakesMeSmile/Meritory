#include <stdlib.h>

// A stack of tickets that doubles its space when full
typedef struct {
    int* items;
    int size;
    int capacity;
} Stack;

static void stackInit(Stack* stack) {
    stack->size = 0;
    stack->capacity = 16;
    stack->items = malloc(sizeof(int) * stack->capacity);
}

static void stackPush(Stack* stack, int item) {
    if (stack->size == stack->capacity) {
        stack->capacity *= 2;
        stack->items = realloc(stack->items, sizeof(int) * stack->capacity);
    }
    stack->items[stack->size++] = item;
}

typedef struct {
    // New tickets go on the inbox, and the outbox holds the oldest on top
    Stack inbox;
    Stack outbox;
} TicketQueue;

TicketQueue* ticketQueueCreate(void) {
    TicketQueue* obj = malloc(sizeof(TicketQueue));
    stackInit(&obj->inbox);
    stackInit(&obj->outbox);
    return obj;
}

void ticketQueueJoin(TicketQueue* obj, int ticket) {
    stackPush(&obj->inbox, ticket);
}

// Pouring only into an empty outbox keeps older tickets ahead of newer ones
static void refill(TicketQueue* obj) {
    if (obj->outbox.size > 0) return;
    while (obj->inbox.size > 0) {
        stackPush(&obj->outbox, obj->inbox.items[--obj->inbox.size]);
    }
}

int ticketQueueServe(TicketQueue* obj) {
    refill(obj);
    return obj->outbox.items[--obj->outbox.size];
}

int ticketQueueFront(TicketQueue* obj) {
    refill(obj);
    return obj->outbox.items[obj->outbox.size - 1];
}

int ticketQueueSize(TicketQueue* obj) {
    return obj->inbox.size + obj->outbox.size;
}

void ticketQueueFree(TicketQueue* obj) {
    free(obj->inbox.items);
    free(obj->outbox.items);
    free(obj);
}
