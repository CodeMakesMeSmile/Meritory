import java.util.ArrayDeque;
import java.util.Deque;

class Solution {
    public int firstBadTag(String[] tags) {
        Deque<String> open = new ArrayDeque<>();
        for (int i = 0; i < tags.length; i++) {
            String tag = tags[i];
            if (!tag.startsWith("/")) {
                open.push(tag);
            } else if (open.isEmpty() || !open.pop().equals(tag.substring(1))) {
                // Nothing was open, or the newest open tag has another name
                return i;
            }
        }
        return open.isEmpty() ? -1 : tags.length;
    }
}
