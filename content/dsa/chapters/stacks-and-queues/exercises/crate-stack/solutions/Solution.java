import java.util.ArrayList;
import java.util.List;

class CrateStack {
    private final List<Integer> weights = new ArrayList<>();
    // lightestSoFar.get(i) is the lightest weight from the bottom up to crate i
    private final List<Integer> lightestSoFar = new ArrayList<>();

    public void push(int weight) {
        int below = lightestSoFar.isEmpty() ? weight : lightestSoFar.get(lightestSoFar.size() - 1);
        weights.add(weight);
        lightestSoFar.add(Math.min(below, weight));
    }

    public int pop() {
        lightestSoFar.remove(lightestSoFar.size() - 1);
        return weights.remove(weights.size() - 1);
    }

    public int top() {
        return weights.get(weights.size() - 1);
    }

    public int lightest() {
        return lightestSoFar.get(lightestSoFar.size() - 1);
    }
}
