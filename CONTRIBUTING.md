# Contributing to WhatsApp Connector

### 1. Development Workflow
1. **Fork** the repository.
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`).
3. **Commit** your changes using signed commits.
4. **Push** to your branch (`git push origin feature/amazing-feature`).
5. **Open** a pull request.

Thank you for your interest in contributing! To keep things smooth and secure, please follow these guidelines.

---

## 2. Signed Commits Required

All commits **must be signed** via GPG to comply with our CI's DCO check.
- Step 1: Generate a GPG key.
    ```bash
    gpg --full-generate-key
    ```
- Step 2: List your GPG key ID.
    ```bash
    gpg --list-secret-keys --keyid-format LONG
    # Copy the long key ID e.g 9A1031CEDBC6E80778963E7A57F3B7F86D8B4D9F
    ```
- Step 3: Export your public GPG key.
    ```bash
    gpg --armor --export 9A1031CEDBC6E80778963E7A57F3B7F86D8B4D9F
    ```
- Step 4: Add GPG key to GitHub.  
    [Go to GitHub → Settings > SSH and GPG keys](https://github.com/settings/keys).  
    Click New GPG key, paste the entire key block (from the previous step), then click Add GPG key. 
- Step 5: Configure Git to use this key
    ```bash
    git config --global user.signingkey 9A1031CEDBC6E80778963E7A57F3B7F86D8B4D9F
    git config --global commit.gpgsign true
    git config --global user.name "Your Name"
    git config --global user.email "your@email.com"
    ```
- Step 6: Make a signed commit
    ```bash
    git commit -S -m "feat: add new feature
    ```
- Step 7: Verify commit is signed
    ```bash
    git log --show-signature
    gpg: Good signature from "Your Name <your@email.com>"
    ```
- Or use the shorthand:
    ```bash
    git commit -s -m "fix: correct typo"
    ```

- We use a GitHub Actions workflow to enforce signed commits. Pull requests from unsigned commits will show a **"Signature check failed"** status.

---

## 3. Creating a Pull Request

1. Fork the repo and create a branch (e.g., `feature/new-webhook`).
2. Make changes: add features, tests, documentation updates.
3. Sign off: ensure every commit is signed.
4. Push to your fork.
5. Open a pull request against the `main` using our template.
6. Add required reviewers (mention @JeremiahChurch and @sasha for roadmap changes).
7. Wait for CI: it must pass (including signature check).

---

## 4. Review Process

- We require **at least two reviewer approvals** before merging.
- Maintain a **clean, rebase-able history** with no merge commits.
- For large number of pull requests or external changes, please open an issue first for discussion.
- Avoid force-pushing after review; update appropriately, then squash and rebase.

---

## 5. Additional Contributions

- **Bug reports**: open an issue, clearly state steps to reproduce and expected behavior.
- **Feature requests**: suggest via issue, include use case and any design notes.
- **Docs & templates**: welcome improvements to README, CONTRIBUTING, ROADMAP, etc.

---

Thank you for helping us build a better tool!
