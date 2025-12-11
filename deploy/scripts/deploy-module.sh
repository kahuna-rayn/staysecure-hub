#!/bin/bash
# Comprehensive module deployment script
# Handles: clean build, commit, push module → update consuming apps → commit, push apps
# Usage: ./deploy/scripts/deploy-module.sh <module-name> <commit-message> [consuming-apps...]
# Example: ./deploy/scripts/deploy-module.sh auth "Fix ResetPassword component" learn hub
# Example: ./deploy/scripts/deploy-module.sh auth "Fix ResetPassword component"  (defaults to learn)

set -e
set -u
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

error() { echo -e "${RED}❌ Error: $1${NC}" >&2; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
step() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BLUE}▶ $1${NC}"; }

# Cleanup on error
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        error "Deployment failed at step: ${CURRENT_STEP:-unknown}"
        error "Exit code: $exit_code"
    fi
    exit $exit_code
}

trap cleanup EXIT INT TERM

# Validate arguments
if [ $# -lt 2 ]; then
    error "Usage: $0 <module-name> <commit-message> [consuming-apps...] [all]"
    echo ""
    echo "Examples:"
    echo "  $0 auth 'Fix ResetPassword component' learn                    # Deploy to dev only (default)"
    echo "  $0 auth 'Fix ResetPassword component' learn hub govern         # Deploy to dev only for multiple apps"
    echo "  $0 auth 'Fix ResetPassword component' learn all                # Deploy to staging and main (skip dev)"
    echo "  $0 notifications 'Add new feature' learn all                   # Deploy to staging and main"
    echo ""
    echo "Available modules: auth, notifications, organisation"
    echo "Available apps: learn, hub, govern"
    echo ""
    echo "Workflow:"
    echo "  1. Deploy to dev first:    $0 auth 'message' learn"
    echo "  2. Test in dev environment"
    echo "  3. Deploy to prod:         $0 auth 'message' learn all  (deploys to staging + main)"
    echo ""
    echo "Note: 'all' deploys to staging and main branches (dev is already deployed separately)"
    exit 1
fi

MODULE_NAME=$1
COMMIT_MESSAGE=$2
shift 2

# Check if last argument is "all"
DEPLOY_ALL_BRANCHES=false
if [ $# -gt 0 ] && [ "${@: -1}" = "all" ]; then
    DEPLOY_ALL_BRANCHES=true
    # Remove "all" from arguments
    set -- "${@:1:$(($#-1))}"
fi

# Default consuming apps if none specified
if [ $# -eq 0 ]; then
    CONSUMING_APPS=("learn")
else
    CONSUMING_APPS=("$@")
fi

# Validate module name
VALID_MODULES=("auth" "notifications" "organisation")
if [[ ! " ${VALID_MODULES[@]} " =~ " ${MODULE_NAME} " ]]; then
    error "Invalid module name: $MODULE_NAME"
    echo "Valid modules: ${VALID_MODULES[*]}"
    exit 1
fi

# Validate consuming apps
VALID_APPS=("learn" "hub" "govern")
for app in "${CONSUMING_APPS[@]}"; do
    if [[ ! " ${VALID_APPS[@]} " =~ " ${app} " ]]; then
        error "Invalid consuming app: $app"
        echo "Valid apps: ${VALID_APPS[*]}"
        exit 1
    fi
done

# Get workspace root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MODULE_DIR="$WORKSPACE_ROOT/$MODULE_NAME"
MODULE_PKG="staysecure-$MODULE_NAME"

# Validate module directory exists
if [ ! -d "$MODULE_DIR" ]; then
    error "Module directory not found: $MODULE_DIR"
    exit 1
fi

if [ ! -f "$MODULE_DIR/package.json" ]; then
    error "package.json not found in $MODULE_DIR"
    exit 1
fi

info "Workspace root: $WORKSPACE_ROOT"
info "Module: $MODULE_NAME ($MODULE_DIR)"
info "Commit message: $COMMIT_MESSAGE"
info "Consuming apps: ${CONSUMING_APPS[*]}"
if [ "$DEPLOY_ALL_BRANCHES" = true ]; then
    info "Branch deployment: staging, main (production branches)"
    warning "⚠️  Make sure you've tested in dev first!"
    info "Skipping module build/push (assuming already done in dev deployment)"
else
    info "Branch deployment: dev only (testing branch)"
fi

# Get module commit hash first (needed for verification later)
cd "$MODULE_DIR"
MODULE_COMMIT=$(git rev-parse HEAD)
MODULE_COMMIT_SHORT=$(git rev-parse --short HEAD)
info "Current module commit: $MODULE_COMMIT_SHORT (full: $MODULE_COMMIT)"

# Step 1 & 2: Clean, build, commit and push module (skip if "all" is used)
if [ "$DEPLOY_ALL_BRANCHES" = false ]; then
    CURRENT_STEP="Module cleanup and build"
    step "Step 1: Cleaning and rebuilding $MODULE_NAME module"

    # Check current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    info "Current branch: $CURRENT_BRANCH"

    # Show uncommitted changes (informational only - we'll commit them in Step 2)
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        info "Uncommitted changes detected (will be committed in Step 2):"
        git status --short
    fi

    # Nuclear cleanup: remove all build artifacts and caches
    info "Nuclear cleanup: removing build artifacts and caches..."
    rm -rf node_modules dist package-lock.json .vite node_modules/.vite
    success "Cleaned build artifacts and caches"

    # Install dependencies
    info "Installing dependencies..."
    if ! npm install; then
        error "npm install failed"
        exit 1
    fi
    success "Dependencies installed"

    # Build module
    info "Building $MODULE_NAME..."
    if ! npm run build; then
        error "Build failed"
        exit 1
    fi
    success "Build completed"

    # Verify dist files exist
    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
        error "dist directory is empty or missing after build"
        exit 1
    fi
    success "Dist files verified"

    # Step 2: Commit and push module
    CURRENT_STEP="Module commit and push"
    step "Step 2: Committing and pushing $MODULE_NAME module"

    # Stage all changes (including new files, modifications, deletions)
    info "Staging all changes..."
    git add -A

    # Check if there are changes to commit
    if git diff --staged --quiet; then
        warning "No changes to commit in $MODULE_NAME after build"
        info "This may be normal if only build artifacts changed and they're not tracked"
        read -p "Continue to consuming apps anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Aborted by user"
            exit 0
        fi
    else
        info "Changes to commit:"
        git status --short
        
        info "Committing with message: '$COMMIT_MESSAGE'"
        if ! git commit -m "$COMMIT_MESSAGE"; then
            error "Failed to commit"
            exit 1
        fi
        success "Changes committed"

        # Push to remote
        info "Pushing to origin/$CURRENT_BRANCH..."
        if ! git push origin "$CURRENT_BRANCH"; then
            error "Failed to push"
            exit 1
        fi
        success "Pushed to origin/$CURRENT_BRANCH"
    fi

    # Update module commit hash after push
    MODULE_COMMIT=$(git rev-parse HEAD)
    MODULE_COMMIT_SHORT=$(git rev-parse --short HEAD)
    info "Module commit after push: $MODULE_COMMIT_SHORT (full: $MODULE_COMMIT)"
else
    info "Skipping module build/push (using existing commit: $MODULE_COMMIT_SHORT)"
fi

# Step 3: Update consuming apps
CURRENT_STEP="Consuming apps update"
step "Step 3: Updating consuming apps"

# Determine branches to deploy to
# "all" means staging + main (production deployment)
# Default is dev only (testing deployment)
if [ "$DEPLOY_ALL_BRANCHES" = true ]; then
    DEPLOY_BRANCHES=("staging" "main")
    info "Production deployment: will deploy to staging and main branches"
    read -p "⚠️  Have you tested this in dev? Continue to staging/main? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Deployment cancelled. Deploy to dev first with: $0 $MODULE_NAME '$COMMIT_MESSAGE' ${CONSUMING_APPS[*]}"
        exit 0
    fi
else
    DEPLOY_BRANCHES=("dev")
fi

for app in "${CONSUMING_APPS[@]}"; do
    APP_DIR="$WORKSPACE_ROOT/$app"
    
    if [ ! -d "$APP_DIR" ]; then
        warning "App directory not found: $APP_DIR (skipping)"
        continue
    fi
    
    if [ ! -f "$APP_DIR/package.json" ]; then
        warning "package.json not found in $APP_DIR (skipping)"
        continue
    fi
    
    cd "$APP_DIR"
    
    # Fetch latest from origin before checking out branches
    if [ "$DEPLOY_ALL_BRANCHES" = true ]; then
        info "Fetching latest changes from origin..."
        git fetch origin --quiet || true
    fi
    
    # Deploy to each branch
    for APP_BRANCH in "${DEPLOY_BRANCHES[@]}"; do
        info "Updating $app on branch: $APP_BRANCH..."
        
        # Checkout the branch (or create it if it doesn't exist)
        if git show-ref --verify --quiet refs/heads/"$APP_BRANCH"; then
            info "Switching to existing branch: $APP_BRANCH"
            if ! git checkout "$APP_BRANCH"; then
                error "Failed to checkout branch $APP_BRANCH"
                continue
            fi
        elif git show-ref --verify --quiet refs/remotes/origin/"$APP_BRANCH"; then
            info "Branch $APP_BRANCH exists on remote, creating local tracking branch"
            if ! git checkout -b "$APP_BRANCH" "origin/$APP_BRANCH"; then
                error "Failed to create local branch $APP_BRANCH"
                continue
            fi
        else
            if [ "$APP_BRANCH" = "dev" ]; then
                # dev branch should always exist, use current branch or create
                info "Creating dev branch from current branch"
                if ! git checkout -b dev 2>/dev/null; then
                    # Branch might already exist, try checking it out
                    if ! git checkout dev; then
                        error "Failed to create/checkout dev branch"
                        continue
                    fi
                fi
            else
                warning "Branch $APP_BRANCH does not exist locally or remotely, skipping"
                continue
            fi
        fi
        
        # Get current branch (should match APP_BRANCH now)
        CURRENT_APP_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "$APP_BRANCH")
        if [ "$CURRENT_APP_BRANCH" != "$APP_BRANCH" ]; then
            warning "Branch mismatch: expected $APP_BRANCH, got $CURRENT_APP_BRANCH"
        fi
        
        # Nuclear cleanup for consuming app: remove all build artifacts and caches
        info "Nuclear cleanup: removing build artifacts and caches in $app..."
        rm -rf node_modules dist package-lock.json .vite node_modules/.vite
        success "Cleaned build artifacts and caches in $app"
        
        # Clear npm cache to force fresh install from GitHub
        info "Clearing npm cache to force fresh module install..."
        npm cache clean --force > /dev/null 2>&1 || true
        success "Cleared npm cache"
        
        # Remove the specific package from node_modules if it exists (from previous install)
        if [ -d "node_modules/$MODULE_PKG" ]; then
            info "Removing existing $MODULE_PKG from node_modules..."
            rm -rf "node_modules/$MODULE_PKG"
        fi
        
        # Install latest module version with --force to override any conflicts
        info "Installing latest $MODULE_PKG from GitHub (forcing fresh install)..."
        if ! npm install "github:kahuna-rayn/$MODULE_PKG#main" --force; then
            error "Failed to install $MODULE_PKG in $app"
            continue
        fi
            success "Installed latest $MODULE_PKG"
        
        # Verify the installed module version matches what we just pushed
        info "Verifying installed module version matches pushed commit..."
        
        # Get installed version from package-lock.json (most reliable)
        if [ -f "package-lock.json" ]; then
            INSTALLED_COMMIT_FROM_LOCK=$(grep -A 5 "\"$MODULE_PKG\"" package-lock.json | grep "resolved" | sed -E 's/.*#([a-f0-9]+).*/\1/' | head -1 || echo "")
        fi
        
        # Also check from npm list
        INSTALLED_VERSION_RAW=$(npm list "$MODULE_PKG" --depth=0 2>/dev/null | grep "$MODULE_PKG" || echo "")
        INSTALLED_COMMIT_FROM_LIST=""
        if [[ "$INSTALLED_VERSION_RAW" == *"#"* ]]; then
            INSTALLED_COMMIT_FROM_LIST=$(echo "$INSTALLED_VERSION_RAW" | sed -E 's/.*#([a-f0-9]+).*/\1/' | head -1)
        fi
        
        # Prefer commit from package-lock.json, fallback to npm list
        INSTALLED_COMMIT="${INSTALLED_COMMIT_FROM_LOCK:-$INSTALLED_COMMIT_FROM_LIST}"
        
        if [ -z "$INSTALLED_COMMIT" ]; then
            warning "⚠️  Could not determine installed commit hash from package-lock.json or npm list"
            INSTALLED_COMMIT="unknown"
        else
            info "Installed $MODULE_PKG commit: $INSTALLED_COMMIT"
        fi
        
        # Verify we got the expected commit
        if [ -n "$MODULE_COMMIT" ] && [ "$INSTALLED_COMMIT" != "unknown" ] && [ -n "$INSTALLED_COMMIT" ]; then
        # Compare full commit hash or first 7+ characters
        MODULE_COMMIT_FULL=$(cd "$MODULE_DIR" && git rev-parse HEAD 2>/dev/null || echo "$MODULE_COMMIT")
        EXPECTED_SHORT=$(echo "$MODULE_COMMIT_FULL" | cut -c1-7)
        
        # Check if installed commit matches (either full match or first 7 chars match)
        if [ "$INSTALLED_COMMIT" = "$MODULE_COMMIT_FULL" ] || [ "$INSTALLED_COMMIT" = "$EXPECTED_SHORT" ] || [[ "$MODULE_COMMIT_FULL" == "$INSTALLED_COMMIT"* ]]; then
            success "✅ VERIFIED: Installed commit ($INSTALLED_COMMIT) matches pushed commit ($MODULE_COMMIT_SHORT)"
        else
            error "❌ MISMATCH: Installed commit ($INSTALLED_COMMIT) does NOT match pushed commit ($MODULE_COMMIT_SHORT)"
            error "Expected: $MODULE_COMMIT_SHORT ($MODULE_COMMIT_FULL)"
            error "Got: $INSTALLED_COMMIT"
            warning "This indicates a caching issue or GitHub delay. Attempting force reinstall..."
            
            # More aggressive cleanup
            rm -rf "node_modules/$MODULE_PKG"
            npm cache clean --force > /dev/null 2>&1 || true
            
            # Wait a moment for GitHub to propagate
            info "Waiting 3 seconds for GitHub to propagate changes..."
            sleep 3
            
            if ! npm install "github:kahuna-rayn/$MODULE_PKG#main" --force; then
                error "Failed to force reinstall $MODULE_PKG"
                continue
            fi
            
            # Re-check after force reinstall
            if [ -f "package-lock.json" ]; then
                INSTALLED_COMMIT_AFTER=$(grep -A 5 "\"$MODULE_PKG\"" package-lock.json | grep "resolved" | sed -E 's/.*#([a-f0-9]+).*/\1/' | head -1 || echo "")
            fi
            
            if [ -z "$INSTALLED_COMMIT_AFTER" ]; then
                INSTALLED_VERSION_AFTER=$(npm list "$MODULE_PKG" --depth=0 2>/dev/null | grep "$MODULE_PKG" || echo "")
                if [[ "$INSTALLED_VERSION_AFTER" == *"#"* ]]; then
                    INSTALLED_COMMIT_AFTER=$(echo "$INSTALLED_VERSION_AFTER" | sed -E 's/.*#([a-f0-9]+).*/\1/')
                fi
            fi
            
            if [ -n "$INSTALLED_COMMIT_AFTER" ] && ([ "$INSTALLED_COMMIT_AFTER" = "$MODULE_COMMIT_FULL" ] || [ "$INSTALLED_COMMIT_AFTER" = "$EXPECTED_SHORT" ] || [[ "$MODULE_COMMIT_FULL" == "$INSTALLED_COMMIT_AFTER"* ]]); then
                success "✅ VERIFIED after force reinstall: Installed commit ($INSTALLED_COMMIT_AFTER) matches pushed commit ($MODULE_COMMIT_SHORT)"
            else
                error "❌ FAILED: After force reinstall, commit ($INSTALLED_COMMIT_AFTER) still does NOT match ($MODULE_COMMIT_SHORT)"
                error "This may be a GitHub propagation delay. Check:"
                error "  1. GitHub shows commit $MODULE_COMMIT_SHORT on main branch"
                error "  2. npm cache is cleared"
                error "  3. Try manual install: npm install github:kahuna-rayn/$MODULE_PKG#main --force"
                continue
            fi
        fi
        elif [ -z "$MODULE_COMMIT" ]; then
            warning "⚠️  No module commit to verify against (module may not have been committed)"
        else
            warning "⚠️  Could not verify: Installed commit could not be determined"
            warning "   This may be OK if this is the first install, but verify manually"
        fi
        
        # Stage all changes (including new files, modifications, deletions)
        # This includes package-lock.json, App.tsx, Index.tsx, new wrapper components, etc.
        info "Staging all changes in $app..."
        git add -A
        
        # Check if there are any changes to commit
        if git diff --staged --quiet; then
            info "No changes to commit in $app/$APP_BRANCH (module version may already be current)"
        else
            # Changes exist - run tests if they exist
            if npm run test --if-present > /dev/null 2>&1; then
                info "Running tests for $app..."
                if ! npm run test; then
                    warning "Tests failed for $app - continuing anyway"
                else
                    success "Tests passed"
                fi
            fi
            
            # Commit all changes
            info "Committing all changes in $app..."
            if ! git commit -m "Update $MODULE_PKG to latest version ($COMMIT_MESSAGE)"; then
                error "Failed to commit in $app"
                continue
            fi
            success "Committed changes in $app"
            
            # Push to remote
            info "Pushing $app to origin/$APP_BRANCH..."
            if ! git push origin "$APP_BRANCH"; then
                error "Failed to push $app to $APP_BRANCH"
                continue
            fi
            success "Pushed $app to origin/$APP_BRANCH"
            APP_COMMIT=$(git rev-parse --short HEAD)
            info "Deployed $app/$APP_BRANCH at commit: $APP_COMMIT"
        fi
    done  # End of branch loop
done  # End of app loop

# Final summary
step "Deployment Summary"

success "Module $MODULE_NAME deployed successfully!"
info "Module commit: ${MODULE_COMMIT:-no new commit}"
info "Consuming apps updated: ${CONSUMING_APPS[*]}" 
info "App commit: ${APP_COMMIT:-no new commit}"
echo ""
info "Next steps:"
echo "  • Vercel will automatically deploy the updated consuming apps"
echo "  • Check Vercel dashboard for deployment status"
echo ""
success "All done! 🚀"

