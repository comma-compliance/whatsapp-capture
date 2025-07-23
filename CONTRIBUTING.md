# 🚀 Contributing to WhatsApp Connector

Thank you for your interest in contributing! To keep things smooth and secure, please follow these guidelines.

---

## 1. Signed Commits Required

All commits **must be signed** via GPG or SSH to comply with our CI's DCO check.

- Add sign-off using:
    ```bash
    git commit -S -m "feat: add new feature

    Signed-off-by: Your Name <you@example.com>"
    ```

- Or use the shorthand:
    ```bash
    git commit -s -m "fix: correct typo"
    ```

- A GitHub Action will automatically **verify signatures** on every push/PR.

---

## 2. Creating a Pull Request

1. Fork the repo and create a branch (e.g., `feature/new-webhook`).
2. Make changes: add features, tests, documentation updates.
3. Sign off: ensure every commit is signed.
4. Push to your fork.
5. Open a PR against `main` using our template.
6. Add required reviewers (mention @JeremiahChurch and @sasha for roadmap changes).
7. Wait for CI: it must pass (including signature check).

---

## 3. PR Checklist

Before requesting review, confirm:

- [ ] ✅ Code builds & all tests pass locally
- [ ] ✅ Commits are signed (check for “Verified” badge in GitHub)
- [ ] 🧹 Code follows project style

---

## 4. Review Process

- We require **at least two reviewer approvals** before merging.
- Maintain a **clean, rebase-able history**—no merge commits.
- For large PRs or external changes, please open an issue first for discussion.
- Avoid force-pushing after review; update appropriately, then squash and rebase.

---

## ⚙️ 5. Commit Signing CI Enforcer

We use a GitHub Actions workflow to enforce signed commits. Pull requests from unsigned commits will show a **"Signature check failed"** status.

---

## 6. Additional Contributions

- **Bug reports**: open an issue, clearly state steps to reproduce and expected behavior.
- **Feature requests**: suggest via issue, include usecase and any design notes.
- **Docs & templates**: welcome improvements to README, CONTRIBUTING, ROADMAP, etc.

---

Thank you for helping us build a better tool! 🎉
