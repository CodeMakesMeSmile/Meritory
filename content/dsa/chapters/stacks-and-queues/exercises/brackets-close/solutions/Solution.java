import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public boolean bracketsClose(String text) {
        Deque<Character> open = new ArrayDeque<>();
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == '(' || c == '[' || c == '{') {
                open.push(c);
            } else if (c == ')' || c == ']' || c == '}') {
                char want = c == ')' ? '(' : c == ']' ? '[' : '{';
                // Only the newest open bracket is allowed to close here
                if (open.isEmpty() || open.pop() != want) return false;
            }
        }
        return open.isEmpty();
    }
}
