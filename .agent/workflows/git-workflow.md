---
description: Git workflow and branching strategy for LetsMeet development
---

# Development Workflow

## Git Branching Strategy

### ⚠️ CRITICAL RULE: Never work directly on `main`

**Always create a feature branch before starting work on any feature, bug fix, or improvement.**

### Branch Naming Convention

- **Features**: `feature/descriptive-name` (e.g., `feature/shareable-links`)
- **Bug fixes**: `fix/descriptive-name` (e.g., `fix/unicode-encoding`)
- **Refactoring**: `refactor/descriptive-name`
- **Documentation**: `docs/descriptive-name`

### Workflow Steps

1. **Before starting any work:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **During development:**
   - Make commits regularly with clear messages
   - Follow conventional commits format: `feat:`, `fix:`, `docs:`, etc.

3. **Before merging:**

   ```bash
   git add -A
   git commit -m "feat: description of feature"
   git push origin feature/your-feature-name
   ```

4. **Merge to main:**

   ```bash
   git checkout main
   git merge feature/your-feature-name
   git tag <version> # if releasing
   git push origin main
   git push origin <version> # if tagged
   ```

5. **Cleanup:**

   ```bash
   git branch -d feature/your-feature-name
   ```

## Release Process

1. Complete feature in feature branch
2. Update `CHANGELOG.md` with changes
3. Merge to `main`
4. Tag with version number (e.g., `1.1`, `1.2`)
5. Push main and tags
6. Cloudflare Pages auto-deploys

## Version Numbering

- **Major** (x.0.0): Breaking changes or major new features
- **Minor** (1.x.0): New features, backwards compatible
- **Patch** (1.1.x): Bug fixes only

## Pre-commit Checklist

- [ ] Working in a feature branch (not `main`)
- [ ] Code tested locally
- [ ] No TypeScript errors (`npm run build`)
- [ ] Commit messages follow conventional commits
- [ ] CHANGELOG.md updated (for releases)
