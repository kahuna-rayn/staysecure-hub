# Migration Guide: Converting to Git Submodule

This guide explains how to extract the organisation module from your current project and set it up as a Git submodule.

## Steps to Extract as Git Submodule

### 1. Create New Repository

First, create a new Git repository for the organisation module:

```bash
# Create new repository on GitHub/GitLab
# Repository name: organisation-management-module
```

### 2. Extract Module Files

```bash
# In your current project root
mkdir temp-org-module
cp -r src/modules/organisation/* temp-org-module/
```

### 3. Initialize Separate Repository

```bash
cd temp-org-module
git init
git add .
git commit -m "Initial commit: Extract organisation management module"
git branch -M main
git remote add origin https://github.com/yourorg/organisation-management-module.git
git push -u origin main
```

### 4. Remove Original Module from Main Project

```bash
# Back in your main project
git rm -r src/modules/organisation
git commit -m "Remove organisation module - will be added as submodule"
```

### 5. Add as Submodule

```bash
# In your main project root
git submodule add https://github.com/yourorg/organisation-management-module.git src/modules/organisation
git submodule update --init --recursive
git add .gitmodules src/modules/organisation
git commit -m "Add organisation module as submodule"
```

### 6. Update Import Paths (if necessary)

Your existing imports should continue to work:

```tsx
// This should still work
import { OrganisationPanel, OrganisationProvider } from '@/modules/organisation';
```

### 7. Update CI/CD Pipeline

Add submodule handling to your CI/CD:

```yaml
# GitHub Actions example
- name: Checkout with submodules
  uses: actions/checkout@v4
  with:
    submodules: recursive
```

## Working with Submodules

### Daily Development

```bash
# Update submodule to latest
git submodule update --remote src/modules/organisation

# Commit the update
git add src/modules/organisation
git commit -m "Update organisation module to latest version"
```

### Making Changes to the Module

```bash
# Go into the submodule
cd src/modules/organisation

# Make sure you're on the correct branch
git checkout main

# Make your changes
# ... edit files ...

# Commit and push changes
git add .
git commit -m "Add new feature"
git push origin main

# Go back to parent project
cd ../../..

# Update parent to use new version
git add src/modules/organisation
git commit -m "Update organisation module with new feature"
```

## Alternative: NPM Package Approach

If you prefer to distribute as an NPM package instead of a Git submodule:

### 1. Build and Publish

```bash
cd temp-org-module
npm run build
npm login
npm publish
```

### 2. Install in Main Project

```bash
# In your main project
npm install @yourorg/organisation-management
```

### 3. Update Imports

```tsx
// Change from:
import { OrganisationPanel } from '@/modules/organisation';

// To:
import { OrganisationPanel } from '@yourorg/organisation-management';
```

## Advantages of Each Approach

### Git Submodule
- ✅ No code duplication
- ✅ Direct development workflow
- ✅ Version pinning per project
- ✅ Private repositories supported
- ❌ Requires Git submodule knowledge
- ❌ Can be complex for teams

### NPM Package
- ✅ Easy to install and update
- ✅ Semantic versioning
- ✅ Better for public distribution
- ✅ Familiar workflow for most developers
- ❌ Requires NPM registry access
- ❌ Additional build/publish step

## Troubleshooting

### Submodule Not Updating

```bash
git submodule update --init --recursive --remote
```

### Submodule Tracking Wrong Branch

```bash
cd src/modules/organisation
git checkout main
cd ../../..
git config -f .gitmodules submodule.src/modules/organisation.branch main
```

### Path Conflicts

If you encounter path resolution issues, update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/modules/organisation": ["./src/modules/organisation/src"]
    }
  }
}
```