# Runs inside the sandbox next to solution.py, signature.json, and cases.json
import builtins
import importlib.util
import json

RESULTS = "results.jsonl"
TOLERANCE = 1e-5
MAX_NODES = 100000


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


# Solutions use them without importing, as on LeetCode
builtins.ListNode = ListNode
builtins.TreeNode = TreeNode


def record(line):
    with open(RESULTS, "a", encoding="utf-8") as out:
        out.write(json.dumps(line) + "\n")


def to_list(values):
    head = ListNode()
    tail = head
    for value in values:
        tail.next = ListNode(value)
        tail = tail.next
    return head.next


def to_tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = [root]
    at = 1
    i = 0
    while i < len(queue) and at < len(values):
        node = queue[i]
        i += 1
        for side in ("left", "right"):
            value = values[at] if at < len(values) else None
            at += 1
            if value is not None:
                child = TreeNode(value)
                setattr(node, side, child)
                queue.append(child)
    return root


def from_list(head):
    values = []
    node = head
    while node is not None and len(values) < MAX_NODES:
        values.append(node.val)
        node = node.next
    return values


def from_tree(root):
    values = []
    queue = [root]
    i = 0
    while i < len(queue) and len(values) < MAX_NODES:
        node = queue[i]
        i += 1
        values.append(node.val if node is not None else None)
        if node is not None:
            queue.append(node.left)
            queue.append(node.right)
    while values and values[-1] is None:
        values.pop()
    return values


def build(kind, value):
    if kind.endswith("[]") and isinstance(value, list):
        inner = kind[:-2]
        if inner.startswith("ListNode") or inner.startswith("TreeNode"):
            return [build(inner, item) for item in value]
    if kind == "ListNode":
        return to_list(value)
    if kind == "TreeNode":
        return to_tree(value)
    return json.loads(json.dumps(value))


def back(kind, value):
    if kind == "ListNode":
        return from_list(value)
    if kind == "TreeNode":
        return from_tree(value)
    if kind.endswith("[]") and isinstance(value, (list, tuple)):
        return [back(kind[:-2], item) for item in value]
    if isinstance(value, tuple):
        return list(value)
    return value


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def same(actual, expected, loose):
    if is_number(actual) and is_number(expected):
        if loose:
            return abs(actual - expected) <= TOLERANCE
        return type(actual) is type(expected) and actual == expected
    if isinstance(actual, list) and isinstance(expected, list):
        return len(actual) == len(expected) and all(
            same(a, e, loose) for a, e in zip(actual, expected)
        )
    return show(actual) == show(expected)


def sorted_copy(value):
    if isinstance(value, list):
        return sorted(value, key=show)
    return value


def matches(kind, actual, expected, any_order=False):
    loose = kind.startswith("double")
    if any_order:
        return same(sorted_copy(actual), sorted_copy(expected), loose)
    return same(actual, expected, loose)


def show(value):
    try:
        return json.dumps(value, separators=(",", ":"))
    except (TypeError, ValueError):
        return repr(value)


def describe(error):
    return f"{type(error).__name__}: {error}"


def is_refusal(expected):
    return isinstance(expected, dict) and "error" in expected


def run_function(fn, signature, test):
    args = {p["name"]: build(p["type"], test["input"].get(p["name"])) for p in signature["params"]}
    # A hidden int marks where a list's tail links back to, -1 for no cycle
    hidden = next((p for p in signature["params"] if p.get("hidden")), None)
    linked = next(
        (p for p in signature["params"] if p["type"] == "ListNode" and not p.get("hidden")),
        None,
    )
    if hidden and linked:
        at = test["input"].get(hidden["name"])
        node = args[linked["name"]]
        target = None
        i = 0
        while node is not None:
            if i == at:
                target = node
            if node.next is None:
                node.next = target
                break
            node = node.next
            i += 1
    passed = [p for p in signature["params"] if not p.get("hidden")]
    refusal = is_refusal(test["expected"])
    try:
        value = fn(*[args[p["name"]] for p in passed])
    except Exception as error:
        if refusal:
            return {"status": "pass"}
        return {"status": "error", "message": describe(error)}
    if refusal:
        return {"status": "fail", "message": f"Expected an error, but got {show(value)}"}
    checks = signature.get("checks")
    checked = next((p for p in signature["params"] if p["name"] == checks), None) if checks else None
    kind = checked["type"] if checked else signature["returns"]
    actual = back(kind, args[checked["name"]] if checked else value)
    if matches(kind, actual, test["expected"], signature.get("anyOrder", False)):
        return {"status": "pass"}
    return {"status": "fail", "message": f"Expected {show(test['expected'])} but got {show(actual)}"}


def run_class(made, signature, test):
    calls = test["input"]["calls"]
    arg_lists = test["input"]["args"]
    expected = test["expected"]
    obj = None
    for i, name in enumerate(calls):
        method = None if i == 0 else next((m for m in signature["methods"] if m["name"] == name), None)
        params = signature["params"] if i == 0 else (method["params"] if method else [])
        raw = arg_lists[i] if i < len(arg_lists) else []
        args = [build(params[at]["type"] if at < len(params) else "", arg) for at, arg in enumerate(raw)]
        try:
            if i == 0:
                obj = made(*args)
                continue
            fn = getattr(obj, name, None)
            if not callable(fn):
                return {"status": "error", "message": f"{signature['class']} has no method {name}"}
            value = fn(*args)
        except Exception as error:
            return {"status": "error", "message": f"Call {i + 1}, {name}: {describe(error)}"}
        returns = method["returns"] if method else "void"
        actual = None if returns == "void" else back(returns, value)
        want = None if returns == "void" else expected[i]
        if not matches(returns, actual, want):
            return {
                "status": "fail",
                "message": f"Call {i + 1}, {name}: expected {show(want)} but got {show(actual)}",
            }
    return {"status": "pass"}


def main():
    with open("signature.json", encoding="utf-8") as f:
        signature = json.load(f)
    with open("cases.json", encoding="utf-8") as f:
        cases = json.load(f)
    spec = importlib.util.spec_from_file_location("solution", "solution.py")
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except SyntaxError as error:
        record({"status": "broken", "message": f"SyntaxError: {error.msg} (line {error.lineno})"})
        return
    except Exception as error:
        record({"status": "broken", "message": describe(error)})
        return
    is_class = "class" in signature
    name = signature["class"] if is_class else signature["function"]
    if is_class:
        target = getattr(module, name, None)
    else:
        holder = getattr(module, "Solution", None)
        target = getattr(holder(), name, None) if holder else getattr(module, name, None)
    for test in cases:
        record({"name": test["name"], "status": "started"})
        if not callable(target):
            kind = "a class" if is_class else "a Solution method"
            record({"name": test["name"], "status": "error", "message": f"solution.py doesn't define {kind} named {name}"})
            continue
        result = run_class(target, signature, test) if is_class else run_function(target, signature, test)
        record({"name": test["name"], **result})


main()
