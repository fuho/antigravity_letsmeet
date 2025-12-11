---
description: How to release a new version of the application
---
# Release Workflow

This workflow describes the process for releasing a new version of the Meeting Point Finder application.

## Prerequisites

- Ensure all tests pass: `npm test`
- Ensure build passes: `npm run build`

## Steps

1. **Start a Feature Branch**
    Always refactor or add features in a separate branch.

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. **Make Changes & Verify**
    Implement your changes and verify with tests.

3. **Bump Version**
    Update the `version` field in `package.json`.

    ```bash
    # Example to 0.2.0
    # Edit package.json manually or use npm version
    npm version patch # or minor, major
    ```

4. **Commit Changes**

    ```bash
    git add .
    git commit -m "Description of changes"
    ```

5. **Merge to Main**

    ```bash
    git checkout main
    git merge feature/your-feature-name
    ```

6. **Tag release**
    Tag the commit with the new version number.

    ```bash
    git tag v0.2.0
    ```

7. **Push to Production**
    Push the code and the tags.

    ```bash
    git push origin main
    git push origin --tags
    ```

## Notes

- Always check `git status` before committing to ensure you are adding the intended files.
- Use semantic versioning (MAJOR.MINOR.PATCH).
