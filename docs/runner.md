# Code runner

The code runner checks answers to coding exercises. It runs inside Ubuntu on WSL2, puts each run in an [Isolate](https://github.com/ioi/isolate) sandbox, and answers the API on `localhost`. Windows reaches services inside WSL2 on `localhost` with no extra setup.

Only the owner's PC runs code for now. Isolate's manual advises against sharing its machine with other workloads, so staging waits.

## 1. Install Ubuntu on WSL2

In PowerShell:

```powershell
wsl --install -d Ubuntu-24.04
```

Restart if it asks, then open Ubuntu from the Start menu and create your Linux user. This Ubuntu starts systemd by default, which Isolate needs. Check it in Ubuntu:

```bash
systemctl is-system-running
```

`running` or `degraded` are both fine.

## 2. Install Isolate

In Ubuntu, add Isolate's package repository and its signing key:

```bash
sudo install -d /etc/apt/keyrings
curl -fsSL https://www.ucw.cz/isolate/debian/signing-key.asc | sudo tee /etc/apt/keyrings/isolate.asc >/dev/null
sudo tee /etc/apt/sources.list.d/isolate.sources >/dev/null <<'EOF'
Types: deb
URIs: http://www.ucw.cz/isolate/debian/
Suites: noble-isolate
Components: main
Architectures: amd64
Signed-By: /etc/apt/keyrings/isolate.asc
EOF
sudo apt update && sudo apt install -y isolate
```

Start the service that gives Isolate its control group, and add yourself to the `isolate` group, since only that group may run `/usr/bin/isolate`:

```bash
sudo systemctl enable --now isolate.service
sudo usermod -aG isolate "$USER"
```

The new group applies to new sessions only. In PowerShell, run `wsl --terminate Ubuntu-24.04`, then open Ubuntu again and check the setup:

```bash
isolate-check-environment
isolate --cg --init && isolate --cg --cleanup
```

`isolate-check-environment` may warn about CPU boost or address space randomization. Those only affect timing precision, so they're fine for practice.

## 3. Install Node and Python

Ubuntu 24.04 already has Python 3. Node's prebuilt Linux build needs `libatomic1`, which WSL's Ubuntu leaves out. Install Node into `/usr/local`, so the sandbox can see it (it only sees `/usr`, `/bin`, and `/lib`):

```bash
sudo apt install -y libatomic1
cd /tmp
curl -fsSLO https://nodejs.org/dist/v26.13.1/node-v26.13.1-linux-x64.tar.xz
curl -fsSL https://nodejs.org/dist/v26.13.1/SHASUMS256.txt | grep linux-x64.tar.xz | sha256sum -c
sudo tar -xJf node-v26.13.1-linux-x64.tar.xz -C /usr/local --strip-components=1
node --version && python3 --version
```

## 4. Turn off swap (optional)

Isolate's memory limits don't count swapped-out memory, so its manual recommends no swap. In Windows, add this to `%UserProfile%\.wslconfig`, then run `wsl --shutdown`. It applies to all of WSL, Docker Desktop included.

```ini
[wsl2]
swap=0
```

## 5. Share a token

The runner only answers requests that carry a shared token. Make one in Ubuntu and save it:

```bash
mkdir -p ~/.config
echo "RUNNER_TOKEN=$(openssl rand -base64 32)" > ~/.config/meritory-runner.env
chmod 600 ~/.config/meritory-runner.env
cat ~/.config/meritory-runner.env
```

Copy that line into the repo's `.env` on Windows, next to `RUNNER_URL=http://localhost:4100`.

## 6. Start the runner

In Ubuntu, go to the Windows checkout, where Windows drives sit under `/mnt`. Change the path to match where your checkout is:

```bash
cd /mnt/c/Users/YOUR_WINDOWS_NAME/Desktop/Projects/Meritory
node --env-file="$HOME/.config/meritory-runner.env" apps/runner/src/main.ts
```

It prints the port it listens on. From PowerShell, `curl.exe http://localhost:4100/health` answers `ok`. Leave the Ubuntu window open while you practise, and the exercise page says plainly when the runner isn't running.

## Limits

Each run gets its own box with no network, up to 16 processes and threads (Node needs a few), 5 seconds of CPU time, 10 seconds of wall time, 256 MB of memory, and 2 MB per file it writes. Code over 64 KB is refused before it reaches the box.

The box gets each case's inputs but never its expected values. The harness inside only writes down what the answer returned, and the runner compares that with the expected values outside the box. So an answer can't read the right answers or write its own verdict.

## Sources (read 2026-11-21)

- [Isolate README](https://github.com/ioi/isolate) and [manual page](https://www.ucw.cz/isolate/isolate.1.html)
- [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install), [Use systemd with WSL](https://learn.microsoft.com/en-us/windows/wsl/systemd), [Accessing network applications with WSL](https://learn.microsoft.com/en-us/windows/wsl/networking), and [Advanced settings configuration in WSL](https://learn.microsoft.com/en-us/windows/wsl/wsl-config)
- [Node.js downloads](https://nodejs.org/en/download)
