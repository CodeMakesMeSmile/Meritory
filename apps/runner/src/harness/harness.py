# Runs inside the sandbox next to solution.py, signature.json, and cases.json
# It only reports what came back. The runner judges it, since nothing here knows the answers.
import builtins
import importlib.util
import json

RESULTS = "results.jsonl"
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


def describe(error):
    return f"{type(error).__name__}: {error}"


def carry(line, value):
    """Adds what came back, or how it looks when JSON can't carry it"""
    try:
        json.dumps(value, allow_nan=False)
        return {**line, "actual": value}
    except (TypeError, ValueError, RecursionError):
        return {**line, "shown": repr(value)}


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
    try:
        value = fn(*[args[p["name"]] for p in passed])
    except Exception as error:
        return {"status": "threw", "message": describe(error)}
    checks = signature.get("checks")
    checked = next((p for p in signature["params"] if p["name"] == checks), None) if checks else None
    kind = checked["type"] if checked else signature["returns"]
    return carry({"status": "done"}, back(kind, args[checked["name"]] if checked else value))


def run_class(made, signature, test, note):
    calls = test["input"]["calls"]
    arg_lists = test["input"]["args"]
    obj = None
    for i, name in enumerate(calls):
        method = None if i == 0 else next((m for m in signature["methods"] if m["name"] == name), None)
        params = signature["params"] if i == 0 else (method["params"] if method else [])
        raw = arg_lists[i] if i < len(arg_lists) else []
        args = [build(params[at]["type"] if at < len(params) else "", arg) for at, arg in enumerate(raw)]
        try:
            if i == 0:
                obj = made(*args)
                note({"status": "call", "actual": None})
                continue
            fn = getattr(obj, name, None)
            if not callable(fn):
                return {"status": "error", "message": f"{signature['class']} has no method {name}"}
            value = fn(*args)
        except Exception as error:
            return {"status": "threw", "message": f"Call {i + 1}, {name}: {describe(error)}"}
        returns = method["returns"] if method else "void"
        note(carry({"status": "call"}, None if returns == "void" else back(returns, value)))
    return {"status": "done"}


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
        if is_class:
            result = run_class(target, signature, test, lambda line: record({"name": test["name"], **line}))
        else:
            result = run_function(target, signature, test)
        record({"name": test["name"], **result})


main()
