#!/bin/bash

# Client Onboarding Script
# Automates the creation of a new Supabase project with all required configuration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to suppress Docker warnings from Supabase CLI
# Filters out Docker/bouncer warnings while preserving other errors
supabase_cmd() {
    "$@" 2> >(grep -v -iE "(docker.*not.*running|bouncer.*config.*error|WARNING.*[Dd]ocker|docker.*is.*not.*running)" >&2 || true)
}

# Configuration
ENVIRONMENT=${1:-prod}  # prod, staging, dev (demo is a data-type, not an environment)
CLIENT_NAME_PARAM=${2:-""}
DATA_TYPE_PARAM=${3:-""}
REGION_PARAM=${4:-""}

# Base domain for all clients
BASE_DOMAIN="staysecure-learn.raynsecure.com"

# Parse parameters with consistent order regardless of environment
# Order: [environment] <client-name> [data-type] [region]
# Note: For backward compatibility, if param 2 looks like a domain (contains '.' or '/'),
#       we ignore it (domains are now auto-constructed)

# Detect if CLIENT_NAME_PARAM is actually a domain (old format)
if [ -n "$CLIENT_NAME_PARAM" ] && ([[ "$CLIENT_NAME_PARAM" == *"."* ]] || [[ "$CLIENT_NAME_PARAM" == *"/"* ]]); then
    # This looks like a domain from the old format - ignore it and shift parameters
    echo -e "${YELLOW}Note: Domain parameter detected (old format). Domains are now auto-constructed, ignoring '${CLIENT_NAME_PARAM}'${NC}"
    echo -e "${YELLOW}      Please use: ./onboard-client.sh ${ENVIRONMENT} <client-name> [data-type] [region]${NC}"
    CLIENT_NAME_PARAM=""
    DATA_TYPE_PARAM=${3:-""}
    REGION_PARAM=${4:-""}
fi

# CLIENT_NAME: Required for all environments
if [ -z "$CLIENT_NAME_PARAM" ]; then
    echo -e "${RED}Error: Client name is required${NC}"
    echo "Usage: ./onboard-client.sh [prod|staging|dev] <client-name> [data-type] [region]"
    echo "Example: ./onboard-client.sh prod rayn seed"
    echo "Example: ./onboard-client.sh prod master seed"
    echo "Example: ./onboard-client.sh staging staging seed"
    echo "Example: ./onboard-client.sh dev dev demo"
    exit 1
else
    CLIENT_NAME="$CLIENT_NAME_PARAM"
fi

# DATA_TYPE and REGION parsing (simplified - no domain parameter)
DATA_TYPE=${DATA_TYPE_PARAM:-seed}
REGION=${REGION_PARAM:-ap-southeast-1}

# Auto-construct CLIENT_DOMAIN based on environment
# Production: staysecure-learn.raynsecure.com/<client-name>
# Dev/Staging: <environment>.staysecure-learn.raynsecure.com
if [ "$ENVIRONMENT" = "prod" ]; then
    CLIENT_DOMAIN="${BASE_DOMAIN}/${CLIENT_NAME}"
else
    # Dev or staging: use subdomain format (e.g., dev.staysecure-learn.raynsecure.com)
    CLIENT_DOMAIN="${ENVIRONMENT}.${BASE_DOMAIN}"
fi

# Validate data type
if [ "$DATA_TYPE" != "seed" ] && [ "$DATA_TYPE" != "demo" ]; then
    echo -e "${RED}Error: Data type must be 'seed' or 'demo'${NC}"
    echo "Usage: ./onboard-client.sh [prod|staging|dev] <client-name> [data-type] [region]"
    echo "  client-name: Required for all environments"
    echo "  data-type: 'seed' for new clients (schema + reference data only)"
    echo "            'demo' for internal/demo (schema + all data including users)"
    echo "  region: Optional, defaults to ap-southeast-1"
    echo ""
    echo "Domain is auto-constructed:"
    echo "  - Production: staysecure-learn.raynsecure.com/<client-name>"
    echo "  - Dev/Staging: <environment>.staysecure-learn.raynsecure.com"
    exit 1
fi

echo -e "${GREEN}Onboarding client: ${CLIENT_NAME} in ${ENVIRONMENT} environment${NC}"

# Get the script directory and parent project root (where canonical supabase/ folder is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${DEPLOY_ROOT}/.." && pwd)"

# Canonical supabase functions are in PROJECT_ROOT/supabase/functions/
# Change to project root for Supabase CLI commands to detect correct workdir
cd "${PROJECT_ROOT}"
echo -e "${GREEN}Working directory: ${PROJECT_ROOT}${NC}"

# Load environment variables from .env or .env.local
if [ -f ".env.local" ]; then
    echo "Loading environment variables from .env.local"
    source .env.local
elif [ -f ".env" ]; then
    echo "Loading environment variables from .env"
    source .env
else
    echo -e "${YELLOW}Warning: No .env or .env.local file found. Make sure environment variables are set.${NC}"
fi

# Create Supabase project
echo -e "${GREEN}Creating Supabase project...${NC}"
# Use PGPASSWORD for both Supabase CLI and psql
if [ -z "$PGPASSWORD" ]; then
    echo -e "${RED}Error: PGPASSWORD environment variable is not set${NC}"
    echo "Please set PGPASSWORD in your environment or .zshrc"
    echo ""
    echo -e "${YELLOW}Note: For new Supabase projects, the database password is set during project creation.${NC}"
    echo -e "${YELLOW}      You can reset it later in Supabase Dashboard → Settings → Database → Database Password${NC}"
    exit 1
fi

echo "Using PGPASSWORD for database operations"
echo -e "${YELLOW}Note: The database password is set during project creation.${NC}"
echo -e "${YELLOW}      To reset it later: Supabase Dashboard → Settings → Database → Database Password${NC}"
echo ""

# Determine project name
# For staging/dev: always use just the environment name (staging, dev)
# For prod: use CLIENT_NAME-ENVIRONMENT format if different, otherwise just CLIENT_NAME
if [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "dev" ]; then
    PROJECT_NAME="${ENVIRONMENT}"
else
    # Production: if CLIENT_NAME equals ENVIRONMENT, just use CLIENT_NAME
    # Otherwise use CLIENT_NAME-ENVIRONMENT format
    if [ "$CLIENT_NAME" = "$ENVIRONMENT" ]; then
        PROJECT_NAME="${CLIENT_NAME}"
    else
        PROJECT_NAME="${CLIENT_NAME}-${ENVIRONMENT}"
    fi
fi

echo "Creating project with name: '${PROJECT_NAME}'"
echo "Region: ${REGION}"
echo "Org ID: ${SUPABASE_ORG_ID}"
PROJECT_REF=$(supabase projects create "${PROJECT_NAME}" --region ${REGION} --org-id ${SUPABASE_ORG_ID} --db-password "${PGPASSWORD}" --output json | jq -r '.id')

if [ -z "$PROJECT_REF" ] || [ "$PROJECT_REF" = "null" ]; then
    echo -e "${RED}Failed to create Supabase project${NC}"
    exit 1
fi

echo -e "${GREEN}Created project: ${PROJECT_REF}${NC}"

# Wait for project to be ready
echo -e "${GREEN}Waiting for project to be ready...${NC}"
echo "This may take 2-3 minutes for the database to be fully initialized..."

# Check project status and wait until it's ready
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    STATUS=$(supabase projects list --output json | jq -r ".[] | select(.id == \"${PROJECT_REF}\") | .status")
    echo "Project status: $STATUS (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS)"
    
    if [ "$STATUS" = "Active" ] || [ "$STATUS" = "ACTIVE_HEALTHY" ]; then
        echo -e "${GREEN}Project is ready!${NC}"
        break
    fi
    
    if [ $ATTEMPT -eq $((MAX_ATTEMPTS - 1)) ]; then
        echo -e "${RED}Project did not become ready within expected time${NC}"
        exit 1
    fi
    
    sleep 10
    ATTEMPT=$((ATTEMPT + 1))
done

# Note: We skip 'supabase link' since we use --project-ref flag for all commands
# This avoids Docker dependency warnings. Linking is only needed for local development.

# Prepare direct Postgres connection string (bypass pooler for admin operations)
CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"

# Restore from backup (if available) or apply schema files
# Backups are in deploy/backups/, so we need to use DEPLOY_ROOT for backup paths
# Check for custom format dumps first, then fall back to SQL format
if [ -f "${DEPLOY_ROOT}/backups/schema.dump" ]; then
    echo -e "${GREEN}Restoring from custom format backup (${DATA_TYPE} data)...${NC}"
    # PGPASSWORD is already set globally, no need to export again
    echo "Using PGPASSWORD for database restoration"
    echo -e "${YELLOW}Note: If connection fails, verify PGPASSWORD matches the database password set during project creation.${NC}"
    echo -e "${YELLOW}      Reset password if needed: Supabase Dashboard → Settings → Database → Database Password${NC}"
    echo ""
    
    # Create connection string using direct database connection (not pooler)
    # PGPASSWORD environment variable will be used for authentication
    CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"

    # Restore schema using pg_restore (custom format preserves dependencies and metadata better)
    echo -e "${GREEN}Restoring schema from custom format dump...${NC}"
    echo "  Step 1: Dropping existing objects (if any)..."
    # Note: --clean --if-exists may show errors on fresh databases (trying to drop non-existent objects)
    # These errors are safe to ignore - filter them out and only show actual errors
    # Filter out expected errors: auth schema (managed by Supabase), relation does not exist (during clean phase)
    RESTORE_OUTPUT=$(pg_restore --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
        --dbname=postgres \
        --no-owner \
        --clean \
        --if-exists \
        ${DEPLOY_ROOT}/backups/schema.dump 2>&1)
    RESTORE_EXIT=$?
    
    # Show progress: creating schemas, types, functions, tables
    echo "  Step 2: Creating schemas and types..."
    echo "$RESTORE_OUTPUT" | grep -E "creating SCHEMA|creating TYPE" | head -5 | sed 's/^/    /' || true
    
    echo "  Step 3: Creating functions..."
    FUNC_COUNT=$(echo "$RESTORE_OUTPUT" | grep -c "creating FUNCTION" || echo "0")
    echo "    Creating ${FUNC_COUNT} functions..."
    
    echo "  Step 4: Creating tables..."
    TABLE_COUNT=$(echo "$RESTORE_OUTPUT" | grep -c "creating TABLE" || echo "0")
    echo "    Creating ${TABLE_COUNT} tables..."
    
    echo "  Step 5: Creating constraints and indexes..."
    CONSTRAINT_COUNT=$(echo "$RESTORE_OUTPUT" | grep -c "creating CONSTRAINT" || echo "0")
    INDEX_COUNT=$(echo "$RESTORE_OUTPUT" | grep -c "creating INDEX" || echo "0")
    echo "    Creating ${CONSTRAINT_COUNT} constraints and ${INDEX_COUNT} indexes..."
    
    echo "  Step 6: Creating triggers and policies..."
    TRIGGER_COUNT=$(echo "$RESTORE_OUTPUT" | grep -c "creating TRIGGER" || echo "0")
    POLICY_COUNT=$(echo "$RESTORE_OUTPUT" | grep -c "creating POLICY" || echo "0")
    echo "    Creating ${TRIGGER_COUNT} triggers and ${POLICY_COUNT} policies..."
    
    # Only show actual errors (not expected ones)
    ERRORS=$(echo "$RESTORE_OUTPUT" | \
        grep -E "error|ERROR|Error|failed|Failed|FAILED" | \
        grep -v "schema \"auth\" does not exist" | \
        grep -v "relation \"public\..*\" does not exist" | \
        grep -v "RI_ConstraintTrigger.*is a system trigger")
    if [ -n "$ERRORS" ]; then
        echo -e "${RED}Errors during schema restore:${NC}"
        echo "$ERRORS" | head -10 | sed 's/^/    /'
    fi
    
    # Check if there are any real errors (not just expected ones)
    if [ $RESTORE_EXIT -ne 0 ]; then
        ERROR_COUNT=$(echo "$RESTORE_OUTPUT" | \
            grep -E "error|ERROR|Error" | \
            grep -v "schema \"auth\" does not exist" | \
            grep -v "relation \"public\..*\" does not exist" | \
            grep -v "RI_ConstraintTrigger.*is a system trigger" | \
            wc -l | tr -d ' ')
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo -e "${RED}Failed to restore schema (real errors detected)${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✓ Schema restored successfully${NC}"
    
    # Storage schema is managed by Supabase and already exists in all projects
    # We only need to create the buckets we use (like avatars)
    echo -e "${GREEN}Ensuring avatars bucket exists...${NC}"
    psql "${CONNECTION_STRING}" \
        --command "INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;" || {
            echo -e "${YELLOW}Warning: Failed to create avatars bucket (may already exist)${NC}"
        }
    
    # Restore data based on type (using custom format if available, otherwise SQL)
    if [ "$DATA_TYPE" = "demo" ] && [ -f "${DEPLOY_ROOT}/backups/demo.dump" ]; then
        echo -e "${GREEN}Restoring demo data...${NC}"
        
        # Restore auth.users first (needed for foreign key constraints with profiles and user_roles)
        if [ -f "${DEPLOY_ROOT}/backups/auth.dump" ]; then
            echo -e "${GREEN}Restoring auth.users...${NC}"
            RESTORE_OUTPUT=$(pg_restore --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
                --dbname=postgres \
                --no-owner \
                --data-only \
                ${DEPLOY_ROOT}/backups/auth.dump 2>&1)
            # Only show errors
            echo "$RESTORE_OUTPUT" | \
                grep -E "error|ERROR|Error|failed|Failed|FAILED" || true
            echo -e "${GREEN}✓ Auth users restored${NC}"
        else
            echo -e "${YELLOW}Warning: auth.dump not found, skipping auth.users restore${NC}"
            echo -e "${YELLOW}         Profiles and user_roles may fail to restore due to missing foreign keys${NC}"
        fi
        
        # Restore all demo data from public schema (auth.users already restored from auth.dump)
        # Using --schema=public excludes auth.users which is in auth schema
        echo -e "${GREEN}Restoring demo data (public schema only, excluding auth.users)...${NC}"
        # Only show errors, filter out expected system trigger errors
        RESTORE_OUTPUT=$(pg_restore --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
            --dbname=postgres \
            --no-owner \
            --data-only \
            --schema=public \
            ${DEPLOY_ROOT}/backups/demo.dump 2>&1)
        echo "$RESTORE_OUTPUT" | \
            grep -E "error|ERROR|Error|failed|Failed|FAILED" | \
            grep -v "RI_ConstraintTrigger.*is a system trigger" || true
        
        echo -e "${GREEN}✓ Demo data restored successfully${NC}"
    elif [ "$DATA_TYPE" = "seed" ] && [ -f "${DEPLOY_ROOT}/backups/seed.dump" ]; then
        echo -e "${GREEN}Restoring seed data (reference data only) from custom format...${NC}"
        echo "  Starting data restore (triggers disabled for faster restore)..."
        
        # First, null out created_by and updated_by columns to avoid FK violations
        # Seed data shouldn't reference users that don't exist
        echo "  Step 1: Nullifying audit columns (created_by, updated_by) in seed tables..."
        psql "${CONNECTION_STRING}" <<EOF 2>&1 | grep -v "does not exist" || true
UPDATE lessons SET created_by = NULL, updated_by = NULL WHERE created_by IS NOT NULL OR updated_by IS NOT NULL;
UPDATE learning_tracks SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE template_variables SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE email_templates SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE email_layouts SET created_by = NULL WHERE created_by IS NOT NULL;
EOF
        
        # Clear existing seed data (CASCADE handles dependencies automatically)
        echo "  Step 2: Clearing existing seed data (if any)..."
        psql "${CONNECTION_STRING}" <<EOF 2>&1 | grep -v "does not exist" || true
-- Truncate all seed tables (CASCADE automatically handles FK dependencies)
TRUNCATE TABLE 
    lesson_answer_translations,
    lesson_node_translations,
    lesson_translations,
    lesson_answers,
    lesson_nodes,
    learning_track_lessons,
    lessons,
    learning_tracks,
    template_variable_translations,
    template_variables,
    email_templates,
    email_layouts,
    languages
CASCADE;
EOF
        
        echo "  Step 3: Restoring seed data..."
        # Show progress by capturing output and displaying table-by-table progress
        RESTORE_OUTPUT=$(pg_restore --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
            --dbname=postgres \
            --no-owner \
            --data-only \
            --disable-triggers \
            --verbose \
            ${DEPLOY_ROOT}/backups/seed.dump 2>&1)
        RESTORE_EXIT=$?
        
        # Show which tables are being restored
        echo "  Restoring data to tables:"
        TABLE_LIST=$(echo "$RESTORE_OUTPUT" | grep -E "pg_restore:.*TABLE DATA public\." | sed 's/.*TABLE DATA public\./    - /' | sed 's/ postgres$//' | sort -u)
        if [ -n "$TABLE_LIST" ]; then
            echo "$TABLE_LIST"
        else
            echo "    (No table restore messages found - this may indicate a problem)"
        fi
        
        # Count actual errors (not warnings)
        ERROR_COUNT=$(echo "$RESTORE_OUTPUT" | \
            grep -E "pg_restore: error:" | \
            grep -v "RI_ConstraintTrigger.*is a system trigger" | \
            wc -l | tr -d ' ')
        
        # Show errors
        ERRORS=$(echo "$RESTORE_OUTPUT" | \
            grep -E "pg_restore: error:" | \
            grep -v "RI_ConstraintTrigger.*is a system trigger")
        if [ -n "$ERRORS" ]; then
            echo -e "${RED}Errors during data restore:${NC}"
            echo "$ERRORS" | head -20 | sed 's/^/    /'
        fi
        
        # Verify seed tables were actually restored (check row counts)
        echo -e "${GREEN}Verifying seed data restoration...${NC}"
        LANGUAGES_COUNT=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM languages;" 2>/dev/null | tr -d ' ')
        LESSONS_COUNT=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM lessons;" 2>/dev/null | tr -d ' ')
        LEARNING_TRACKS_COUNT=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM learning_tracks;" 2>/dev/null | tr -d ' ')
        TEMPLATE_VARS_COUNT=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM template_variables;" 2>/dev/null | tr -d ' ')
        EMAIL_TEMPLATES_COUNT=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM email_templates;" 2>/dev/null | tr -d ' ')
        
        echo "  Languages: ${LANGUAGES_COUNT:-0}"
        echo "  Lessons: ${LESSONS_COUNT:-0}"
        echo "  Learning Tracks: ${LEARNING_TRACKS_COUNT:-0}"
        echo "  Template Variables: ${TEMPLATE_VARS_COUNT:-0}"
        echo "  Email Templates: ${EMAIL_TEMPLATES_COUNT:-0}"
        
        # Determine if restore was successful
        # Success means: no errors OR errors but data was still inserted
        RESTORE_SUCCESS=false
        if [ "$ERROR_COUNT" -eq 0 ]; then
            RESTORE_SUCCESS=true
        elif [ "${LANGUAGES_COUNT:-0}" -gt 0 ] && [ "${LESSONS_COUNT:-0}" -gt 0 ]; then
            # Some data was restored despite errors
            echo -e "${YELLOW}Warning: Some errors occurred, but data was partially restored${NC}"
            RESTORE_SUCCESS=true
        fi
        
        if [ "${LANGUAGES_COUNT:-0}" -eq 0 ] && [ "${LESSONS_COUNT:-0}" -eq 0 ] && [ "${LEARNING_TRACKS_COUNT:-0}" -eq 0 ]; then
            echo -e "${RED}✗ Seed data restore FAILED - no data found in database${NC}"
            echo -e "${YELLOW}Full restore output saved to /tmp/restore-seed-debug.log${NC}"
            echo "$RESTORE_OUTPUT" > /tmp/restore-seed-debug.log
            echo ""
            echo "Debug info:"
            echo "  Restore exit code: $RESTORE_EXIT"
            echo "  Error count: $ERROR_COUNT"
            echo "  Total output lines: $(echo "$RESTORE_OUTPUT" | wc -l | tr -d ' ')"
            exit 1
        elif [ "$RESTORE_SUCCESS" = true ]; then
            echo -e "${GREEN}✓ Seed data restored successfully${NC}"
        else
            echo -e "${YELLOW}⚠ Seed data partially restored (some errors occurred)${NC}"
            echo -e "${YELLOW}Full restore output saved to /tmp/restore-seed-debug.log${NC}"
            echo "$RESTORE_OUTPUT" > /tmp/restore-seed-debug.log
        fi
    elif [ "$DATA_TYPE" = "demo" ] && [ -f "${DEPLOY_ROOT}/backups/demo.sql" ]; then
        echo -e "${GREEN}Restoring demo data (including users) from SQL format...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --command 'SET session_replication_role = replica' \
            --file ${DEPLOY_ROOT}/backups/demo.sql || {
                echo -e "${RED}Failed to restore demo data${NC}"
                exit 1
            }
    elif [ "$DATA_TYPE" = "seed" ] && [ -f "${DEPLOY_ROOT}/backups/seed.sql" ]; then
        echo -e "${GREEN}Restoring seed data (reference data only) from SQL format...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --command 'SET session_replication_role = replica' \
            --file ${DEPLOY_ROOT}/backups/seed.sql || {
                echo -e "${RED}Failed to restore seed data${NC}"
                exit 1
            }
    else
        echo -e "${YELLOW}Warning: No data backup found (demo.dump/seed.dump or demo.sql/seed.sql), skipping data restoration${NC}"
    fi
    
    # Apply post-migration fixes (fixes that aren't in the schema dump, including RLS policies, permissions, and triggers)
    # This includes the on_auth_user_created trigger
    if [ -f "${DEPLOY_ROOT}/scripts/post-migration-fixes.sql" ]; then
        echo -e "${GREEN}Applying post-migration fixes...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --file ${DEPLOY_ROOT}/scripts/post-migration-fixes.sql || {
                echo -e "${RED}Error: Failed to apply post-migration fixes${NC}"
                exit 1
            }
        
        # Verify critical trigger was created
        echo "Verifying on_auth_user_created trigger was created..."
        TRIGGER_EXISTS=$(psql "${CONNECTION_STRING}" -t -c "SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created');" 2>&1 | grep -v "ERROR" | tr -d ' \n' | head -1)
        if [ "$TRIGGER_EXISTS" != "t" ]; then
            echo -e "${RED}Error: on_auth_user_created trigger was not created${NC}"
            echo -e "${YELLOW}Attempting to create trigger manually...${NC}"
            psql "${CONNECTION_STRING}" \
                --command "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();" || {
                    echo -e "${RED}Failed to create trigger manually${NC}"
                    exit 1
                }
            echo -e "${GREEN}Trigger created successfully${NC}"
        else
            echo -e "${GREEN}✓ on_auth_user_created trigger verified${NC}"
        fi
        
        # Apply foreign keys as safety net (even though they're in schema.dump, pg_restore may miss them)
        # Each FK runs in its own transaction to avoid aborting all on first error
        if [ -f "${DEPLOY_ROOT}/scripts/foreign_keys.sql" ]; then
            echo -e "${GREEN}Applying foreign key constraints (safety net)...${NC}"
            psql "${CONNECTION_STRING}" \
                --variable ON_ERROR_STOP=0 \
                --file ${DEPLOY_ROOT}/scripts/foreign_keys.sql 2>&1 | grep -v "already exists" | grep -v "current transaction is aborted" || {
                echo -e "${YELLOW}Note: Some foreign keys may already exist (this is expected)${NC}"
            }
            echo -e "${GREEN}✓ Foreign keys applied${NC}"
        fi
    else
        echo -e "${RED}Error: post-migration-fixes.sql not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Backup restored successfully${NC}"
elif [ -f "${DEPLOY_ROOT}/backups/schema.sql" ]; then
    echo -e "${GREEN}Restoring from SQL format backup (${DATA_TYPE} data)...${NC}"
    # PGPASSWORD is already set globally, no need to export again
    echo "Using PGPASSWORD for database restoration"
    echo -e "${YELLOW}Note: If connection fails, verify PGPASSWORD matches the database password set during project creation.${NC}"
    echo -e "${YELLOW}      Reset password if needed: Supabase Dashboard → Settings → Database → Database Password${NC}"
    echo ""
    
    # Create connection string using direct database connection (not pooler)
    # PGPASSWORD environment variable will be used for authentication
    CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"

    # Restore schema
    echo -e "${GREEN}Restoring schema from SQL...${NC}"
    psql "${CONNECTION_STRING}" \
        --single-transaction \
        --variable ON_ERROR_STOP=1 \
        --file ${DEPLOY_ROOT}/backups/schema.sql || {
            echo -e "${RED}Failed to restore schema${NC}"
            exit 1
        }
    
    # Restore data based on type
    if [ "$DATA_TYPE" = "demo" ] && [ -f "${DEPLOY_ROOT}/backups/demo.sql" ]; then
        echo -e "${GREEN}Restoring demo data (including users)...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --command 'SET session_replication_role = replica' \
            --file ${DEPLOY_ROOT}/backups/demo.sql || {
                echo -e "${RED}Failed to restore demo data${NC}"
                exit 1
            }
    elif [ "$DATA_TYPE" = "seed" ] && [ -f "${DEPLOY_ROOT}/backups/seed.sql" ]; then
        echo -e "${GREEN}Restoring seed data (reference data only)...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --command 'SET session_replication_role = replica' \
            --file ${DEPLOY_ROOT}/backups/seed.sql || {
                echo -e "${RED}Failed to restore seed data${NC}"
                exit 1
            }
    else
        echo -e "${YELLOW}Warning: demo.sql not found, skipping data restoration${NC}"
    fi
    
    # Apply post-migration fixes (fixes that aren't in the schema dump, including RLS policies, permissions, and triggers)
    # This includes the on_auth_user_created trigger
    if [ -f "${DEPLOY_ROOT}/scripts/post-migration-fixes.sql" ]; then
        echo -e "${GREEN}Applying post-migration fixes...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --file ${DEPLOY_ROOT}/scripts/post-migration-fixes.sql || {
                echo -e "${RED}Error: Failed to apply post-migration fixes${NC}"
                exit 1
            }
        
        # Verify critical trigger was created
        echo "Verifying on_auth_user_created trigger was created..."
        TRIGGER_EXISTS=$(psql "${CONNECTION_STRING}" -t -c "SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created');" 2>&1 | grep -v "ERROR" | tr -d ' \n' | head -1)
        if [ "$TRIGGER_EXISTS" != "t" ]; then
            echo -e "${RED}Error: on_auth_user_created trigger was not created${NC}"
            echo -e "${YELLOW}Attempting to create trigger manually...${NC}"
            psql "${CONNECTION_STRING}" \
                --command "DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();" || {
                    echo -e "${RED}Failed to create trigger manually${NC}"
                    exit 1
                }
            echo -e "${GREEN}Trigger created successfully${NC}"
        else
            echo -e "${GREEN}✓ on_auth_user_created trigger verified${NC}"
        fi
    else
        echo -e "${RED}Error: post-migration-fixes.sql not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Backup restored successfully${NC}"
else
    echo -e "${YELLOW}No backup found, applying schema files...${NC}"
    FILES=(
        "01_tables.sql"
        "02_functions.sql"
        "03_demo.sql"
        "04_rls_policies.sql"
        "05_foreign_keys.sql"
        "06_primary_keys.sql"
        "07_triggers.sql"
    )

    for file in "${FILES[@]}"; do
        if [ -f "${DEPLOY_ROOT}/$file" ]; then
            echo "Applying $file..."
            (cd "${PROJECT_ROOT}" && supabase db execute --file "${DEPLOY_ROOT}/$file" --project-ref ${PROJECT_REF}) || {
                echo -e "${RED}Failed to apply $file${NC}"
                exit 1
            }
        else
            echo -e "${YELLOW}Warning: $file not found${NC}"
        fi
    done
    
    # Apply post-migration fixes (fixes that aren't in the schema dump, including RLS policies, permissions, and triggers)
    CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"
    if [ -f "${DEPLOY_ROOT}/scripts/post-migration-fixes.sql" ]; then
        echo -e "${GREEN}Applying post-migration fixes...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --file ${DEPLOY_ROOT}/scripts/post-migration-fixes.sql || {
                echo -e "${YELLOW}Warning: Failed to apply post-migration fixes${NC}"
            }
    else
        echo -e "${YELLOW}Warning: post-migration-fixes.sql not found, skipping${NC}"
    fi
fi

# Set Edge Function secrets
echo -e "${GREEN}Setting Edge Function secrets...${NC}"
# Set APP_BASE_URL based on client domain
APP_BASE_URL="https://${CLIENT_DOMAIN}"

# Default manager notification cooldown (can override via env)
MANAGER_NOTIFICATION_COOLDOWN_HOURS=${MANAGER_NOTIFICATION_COOLDOWN_HOURS:-120}
echo "Using manager notification cooldown: ${MANAGER_NOTIFICATION_COOLDOWN_HOURS} hours"

# Note: SMTP configuration must be set in Supabase Dashboard for email functions to work
echo -e "${YELLOW}Note: Configure SMTP settings in Supabase Dashboard for email functionality${NC}"

# Set AUTH_LAMBDA_URL if not provided (placeholder for centralized email service)
if [ -z "$AUTH_LAMBDA_URL" ]; then
    echo -e "${YELLOW}Warning: AUTH_LAMBDA_URL not set, using placeholder${NC}"
    AUTH_LAMBDA_URL="https://nsvovgtia6cx7lel75yzt5mc4q0fhsyh.lambda-url.ap-southeast-1.on.aws/"
fi

# Check for required environment variables
REQUIRED_VARS=(
    "SUPABASE_SERVICE_ROLE_KEY"
    "SUPABASE_DB_URL"
    "AUTH_LAMBDA_URL"
    "GOOGLE_TRANSLATE_API_KEY"
    "DEEPL_API_KEY"
    "APP_BASE_URL"
    "MANAGER_NOTIFICATION_COOLDOWN_HOURS"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo -e "${YELLOW}Please set these variables before running the script${NC}"
    exit 1
fi

# Verify supabase/functions directory exists (we're already in deploy root)
if [ ! -d "supabase/functions" ]; then
    echo -e "${RED}Error: supabase/functions directory not found in ${DEPLOY_ROOT}${NC}"
    exit 1
fi

echo -e "${GREEN}Setting Edge Function secrets...${NC}"
# Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically provided by Supabase
# and cannot be set manually (they're created when the project is created).
# Edge Functions can access them via Deno.env.get('SUPABASE_URL') and Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

# Use subshell to ensure we're in project root for all Supabase CLI commands
# Canonical functions are in PROJECT_ROOT/supabase/functions/
# Use supabase_cmd to suppress Docker warnings
(cd "${PROJECT_ROOT}" && supabase_cmd supabase secrets set \
    GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY} \
    DEEPL_API_KEY=${DEEPL_API_KEY} \
    AUTH_LAMBDA_URL=${AUTH_LAMBDA_URL} \
    APP_BASE_URL=${APP_BASE_URL} \
    MANAGER_NOTIFICATION_COOLDOWN_HOURS=${MANAGER_NOTIFICATION_COOLDOWN_HOURS} \
    --project-ref ${PROJECT_REF})

# Deploy Edge Functions (not included in database dumps)
echo -e "${GREEN}Deploying Edge Functions...${NC}"

# Deploy each function (only if it exists)
# Canonical functions are in PROJECT_ROOT/supabase/functions/ (tracked in git)
FUNCTIONS=("create-user" "delete-user" "send-email" "send-lesson-reminders" "send-password-reset" "translate-lesson" "translation-status" "update-user-password" "process-scheduled-notifications")

for func in "${FUNCTIONS[@]}"; do
    FUNC_PATH="supabase/functions/${func}"
    if [ -d "${PROJECT_ROOT}/${FUNC_PATH}" ] && [ -f "${PROJECT_ROOT}/${FUNC_PATH}/index.ts" ]; then
        echo -e "${GREEN}Deploying ${func}...${NC}"
        echo -e "${YELLOW}  Path: ${PROJECT_ROOT}/${FUNC_PATH}${NC}"
        # Use subshell to ensure correct workdir - functions are in project root
        # Use supabase_cmd to suppress Docker warnings
        (cd "${PROJECT_ROOT}" && supabase_cmd supabase functions deploy "${func}" --no-verify-jwt --project-ref ${PROJECT_REF}) || {
            echo -e "${YELLOW}Warning: Failed to deploy ${func}, continuing...${NC}"
        }
    else
        echo -e "${YELLOW}Warning: Function ${func} not found at ${PROJECT_ROOT}/${FUNC_PATH}, skipping...${NC}"
    fi
done

# Ensure pg_cron is enabled and schedule manager notification job
echo -e "${GREEN}Configuring manager notification cron job...${NC}"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/process-scheduled-notifications"
AUTH_HEADER="Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

psql "${CONNECTION_STRING}" <<SQL
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
DO \$\$
BEGIN
  PERFORM cron.unschedule('process-manager-notifications');
EXCEPTION
  WHEN others THEN NULL;
END
\$\$;
SELECT cron.schedule(
  'process-manager-notifications',
  '0 1 * * *',
  format(
    \$cron$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', %L
        ),
        body := jsonb_build_object(
          'notification_type', 'manager_employee_incomplete'
        )
      );
    \$cron$,
    '${FUNCTION_URL}',
    '${AUTH_HEADER}'
  )
) AS cron_job_id;
SQL

if [ $? -ne 0 ]; then
    echo -e "${RED}Error configuring pg_cron job${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Manager notification cron job scheduled (UTC 01:00 daily)${NC}"

# Set client service key in master database for sync-lesson-content Edge Function
# This allows the master database to sync content to this client database
if [ -n "$MASTER_PROJECT_REF" ]; then
    echo -e "${GREEN}Setting client service key in master database for sync...${NC}"
    CLIENT_SERVICE_KEY=$(supabase projects api-keys --project-ref ${PROJECT_REF} | grep 'service_role' | awk '{print $3}')
    
    if [ -n "$CLIENT_SERVICE_KEY" ]; then
        SECRET_NAME="CLIENT_SERVICE_KEY_${PROJECT_REF}"
        echo "Setting secret ${SECRET_NAME} in master project ${MASTER_PROJECT_REF}"
        supabase secrets set ${SECRET_NAME}=${CLIENT_SERVICE_KEY} \
            --project-ref ${MASTER_PROJECT_REF} 2>&1 | tee /tmp/set-sync-secret.log
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Client service key stored in master Edge Function secrets${NC}"
            echo -e "${GREEN}  Secret name: ${SECRET_NAME}${NC}"
        else
            echo -e "${YELLOW}Warning: Failed to set client service key in master database${NC}"
            echo -e "${YELLOW}  You may need to set this manually:${NC}"
            echo -e "${YELLOW}  supabase secrets set ${SECRET_NAME}=${CLIENT_SERVICE_KEY} --project-ref ${MASTER_PROJECT_REF}${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Could not retrieve client service key${NC}"
        echo -e "${YELLOW}  Get it from: Supabase Dashboard → Settings → API → service_role key${NC}"
        echo -e "${YELLOW}  Then set manually: supabase secrets set CLIENT_SERVICE_KEY_${PROJECT_REF}=<key> --project-ref ${MASTER_PROJECT_REF}${NC}"
    fi
else
    echo -e "${YELLOW}Note: MASTER_PROJECT_REF not set, skipping sync secret setup${NC}"
    echo -e "${YELLOW}  To enable content syncing, set MASTER_PROJECT_REF environment variable${NC}"
    echo -e "${YELLOW}  Then manually set: supabase secrets set CLIENT_SERVICE_KEY_${PROJECT_REF}=<service_key> --project-ref <master_ref>${NC}"
fi

# Verify restore by comparing object counts with source database
echo ""
echo -e "${GREEN}Verifying restore completeness...${NC}"

# Get source project reference (dev/reference project)
SOURCE_PROJECT_REF="cleqfnrbiqpxpzxkatda"
CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"

# Collect counts from target (newly restored) database
echo "Collecting object counts from target database..."
TARGET_TABLES=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
TARGET_POLICIES=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
TARGET_FUNCTIONS=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace;" 2>&1 | grep -v "ERROR" | tr -d ' \n')
TARGET_TRIGGERS=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND tgisinternal = false;" 2>&1 | grep -v "ERROR" | tr -d ' \n')
TARGET_INDEXES=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
TARGET_VIEWS=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
TARGET_TYPES=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'c';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
TARGET_STORAGE_POLICIES=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
TARGET_AUTH_TRIGGERS=$(psql "${CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'auth';" 2>&1 | grep -v "ERROR" | tr -d ' \n')

# Check critical trigger in target
echo "Checking critical components..."
TARGET_AUTH_USER_TRIGGER=$(psql "${CONNECTION_STRING}" -t -c "SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created');" 2>&1 | grep -v "ERROR" | tr -d ' \n' | head -1)
[ "$TARGET_AUTH_USER_TRIGGER" = "t" ] && TARGET_AUTH_USER_TRIGGER="Yes" || TARGET_AUTH_USER_TRIGGER="No"

# Check edge functions
EXPECTED_FUNCTIONS=("create-user" "delete-user" "send-email" "send-lesson-reminders" "send-password-reset" "translate-lesson" "translation-status" "update-user-password" "process-scheduled-notifications")
FUNCTIONS_LIST=$(supabase functions list --project-ref ${PROJECT_REF} --output json 2>/dev/null | jq -r '.[].slug' 2>/dev/null || echo "")
TARGET_EDGE_FUNCTIONS=0
for func in "${EXPECTED_FUNCTIONS[@]}"; do
    if echo "$FUNCTIONS_LIST" | grep -q "^${func}$"; then
        TARGET_EDGE_FUNCTIONS=$((TARGET_EDGE_FUNCTIONS + 1))
    fi
done

# Check edge function secrets
EXPECTED_SECRETS=("GOOGLE_TRANSLATE_API_KEY" "DEEPL_API_KEY" "AUTH_LAMBDA_URL" "APP_BASE_URL" "MANAGER_NOTIFICATION_COOLDOWN_HOURS")
SECRETS_LIST=$(supabase secrets list --project-ref ${PROJECT_REF} --output json 2>/dev/null | jq -r '.[].name' 2>/dev/null || echo "")
TARGET_EDGE_SECRETS=0
for secret in "${EXPECTED_SECRETS[@]}"; do
    if echo "$SECRETS_LIST" | grep -q "^${secret}$"; then
        TARGET_EDGE_SECRETS=$((TARGET_EDGE_SECRETS + 1))
    fi
done

# Collect counts from source (reference) database
echo "Collecting object counts from source database (dev)..."
SOURCE_CONNECTION_STRING="host=db.${SOURCE_PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"
SOURCE_TABLES=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
SOURCE_POLICIES=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
SOURCE_FUNCTIONS=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace;" 2>&1 | grep -v "ERROR" | tr -d ' \n')
SOURCE_TRIGGERS=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND tgisinternal = false;" 2>&1 | grep -v "ERROR" | tr -d ' \n')
SOURCE_INDEXES=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
SOURCE_VIEWS=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
SOURCE_TYPES=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'c';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
SOURCE_STORAGE_POLICIES=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage';" 2>&1 | grep -v "ERROR" | tr -d ' \n')
SOURCE_AUTH_TRIGGERS=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'auth';" 2>&1 | grep -v "ERROR" | tr -d ' \n')

# Check critical trigger in source
SOURCE_AUTH_USER_TRIGGER=$(psql "${SOURCE_CONNECTION_STRING}" -t -c "SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created');" 2>&1 | grep -v "ERROR" | tr -d ' \n' | head -1)
[ "$SOURCE_AUTH_USER_TRIGGER" = "t" ] && SOURCE_AUTH_USER_TRIGGER="Yes" || SOURCE_AUTH_USER_TRIGGER="No"

# Check edge functions in source (dev) project
SOURCE_FUNCTIONS_LIST=$(supabase functions list --project-ref ${SOURCE_PROJECT_REF} --output json 2>/dev/null | jq -r '.[].slug' 2>/dev/null || echo "")
SOURCE_EDGE_FUNCTIONS=0
for func in "${EXPECTED_FUNCTIONS[@]}"; do
    if echo "$SOURCE_FUNCTIONS_LIST" | grep -q "^${func}$"; then
        SOURCE_EDGE_FUNCTIONS=$((SOURCE_EDGE_FUNCTIONS + 1))
    fi
done

# Check edge function secrets in source (dev) project
SOURCE_SECRETS_LIST=$(supabase secrets list --project-ref ${SOURCE_PROJECT_REF} --output json 2>/dev/null | jq -r '.[].name' 2>/dev/null || echo "")
SOURCE_EDGE_SECRETS=0
for secret in "${EXPECTED_SECRETS[@]}"; do
    if echo "$SOURCE_SECRETS_LIST" | grep -q "^${secret}$"; then
        SOURCE_EDGE_SECRETS=$((SOURCE_EDGE_SECRETS + 1))
    fi
done

# Default empty values to "?" if queries failed
[ -z "$TARGET_TABLES" ] && TARGET_TABLES="?"
[ -z "$SOURCE_TABLES" ] && SOURCE_TABLES="?"
[ -z "$TARGET_POLICIES" ] && TARGET_POLICIES="?"
[ -z "$SOURCE_POLICIES" ] && SOURCE_POLICIES="?"
[ -z "$TARGET_FUNCTIONS" ] && TARGET_FUNCTIONS="?"
[ -z "$SOURCE_FUNCTIONS" ] && SOURCE_FUNCTIONS="?"
[ -z "$TARGET_TRIGGERS" ] && TARGET_TRIGGERS="?"
[ -z "$SOURCE_TRIGGERS" ] && SOURCE_TRIGGERS="?"
[ -z "$TARGET_INDEXES" ] && TARGET_INDEXES="?"
[ -z "$SOURCE_INDEXES" ] && SOURCE_INDEXES="?"
[ -z "$TARGET_VIEWS" ] && TARGET_VIEWS="?"
[ -z "$SOURCE_VIEWS" ] && SOURCE_VIEWS="?"
[ -z "$TARGET_TYPES" ] && TARGET_TYPES="?"
[ -z "$SOURCE_TYPES" ] && SOURCE_TYPES="?"
[ -z "$TARGET_STORAGE_POLICIES" ] && TARGET_STORAGE_POLICIES="?"
[ -z "$SOURCE_STORAGE_POLICIES" ] && SOURCE_STORAGE_POLICIES="?"
[ -z "$TARGET_AUTH_TRIGGERS" ] && TARGET_AUTH_TRIGGERS="?"
[ -z "$SOURCE_AUTH_TRIGGERS" ] && SOURCE_AUTH_TRIGGERS="?"
[ -z "$TARGET_AUTH_USER_TRIGGER" ] && TARGET_AUTH_USER_TRIGGER="?"
[ -z "$SOURCE_AUTH_USER_TRIGGER" ] && SOURCE_AUTH_USER_TRIGGER="?"
[ -z "$TARGET_EDGE_FUNCTIONS" ] && TARGET_EDGE_FUNCTIONS="?"
[ -z "$SOURCE_EDGE_FUNCTIONS" ] && SOURCE_EDGE_FUNCTIONS="?"
[ -z "$TARGET_EDGE_SECRETS" ] && TARGET_EDGE_SECRETS="?"
[ -z "$SOURCE_EDGE_SECRETS" ] && SOURCE_EDGE_SECRETS="?"

# Display comparison table
echo ""
echo "┌─────────────────────────┬──────────────┬──────────────┬─────────┐"
echo "│ Object Type             │ Source (Dev) │ Target (New) │ Status  │"
echo "├─────────────────────────┼──────────────┼──────────────┼─────────┤"
printf "│ %-23s │ %12s │ %12s │" "Tables" "$SOURCE_TABLES" "$TARGET_TABLES"
if [ "$SOURCE_TABLES" = "$TARGET_TABLES" ] && [ "$SOURCE_TABLES" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
printf "│ %-23s │ %12s │ %12s │" "Policies" "$SOURCE_POLICIES" "$TARGET_POLICIES"
if [ "$SOURCE_POLICIES" = "$TARGET_POLICIES" ] && [ "$SOURCE_POLICIES" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
printf "│ %-23s │ %12s │ %12s │" "Functions" "$SOURCE_FUNCTIONS" "$TARGET_FUNCTIONS"
if [ "$SOURCE_FUNCTIONS" = "$TARGET_FUNCTIONS" ] && [ "$SOURCE_FUNCTIONS" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
printf "│ %-23s │ %12s │ %12s │" "Triggers" "$SOURCE_TRIGGERS" "$TARGET_TRIGGERS"
if [ "$SOURCE_TRIGGERS" = "$TARGET_TRIGGERS" ] && [ "$SOURCE_TRIGGERS" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
printf "│ %-23s │ %12s │ %12s │" "Indexes" "$SOURCE_INDEXES" "$TARGET_INDEXES"
if [ "$SOURCE_INDEXES" = "$TARGET_INDEXES" ] && [ "$SOURCE_INDEXES" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
printf "│ %-23s │ %12s │ %12s │" "Views" "$SOURCE_VIEWS" "$TARGET_VIEWS"
if [ "$SOURCE_VIEWS" = "$TARGET_VIEWS" ] && [ "$SOURCE_VIEWS" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
printf "│ %-23s │ %12s │ %12s │" "Types" "$SOURCE_TYPES" "$TARGET_TYPES"
if [ "$SOURCE_TYPES" = "$TARGET_TYPES" ] && [ "$SOURCE_TYPES" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
printf "│ %-23s │ %12s │ %12s │" "Storage Policies" "$SOURCE_STORAGE_POLICIES" "$TARGET_STORAGE_POLICIES"
if [ "$SOURCE_STORAGE_POLICIES" = "$TARGET_STORAGE_POLICIES" ] && [ "$SOURCE_STORAGE_POLICIES" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
printf "│ %-23s │ %12s │ %12s │" "Auth Triggers" "$SOURCE_AUTH_TRIGGERS" "$TARGET_AUTH_TRIGGERS"
if [ "$SOURCE_AUTH_TRIGGERS" = "$TARGET_AUTH_TRIGGERS" ] && [ "$SOURCE_AUTH_TRIGGERS" != "?" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
# Critical: on_auth_user_created trigger
printf "│ %-23s │ %12s │ %12s │" "on_auth_user_created ⚠" "$SOURCE_AUTH_USER_TRIGGER" "$TARGET_AUTH_USER_TRIGGER"
if [ "$TARGET_AUTH_USER_TRIGGER" = "Yes" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
# Edge functions
printf "│ %-23s │ %12s │ %12s │" "Edge Functions" "$SOURCE_EDGE_FUNCTIONS" "$TARGET_EDGE_FUNCTIONS"
if [ "$TARGET_EDGE_FUNCTIONS" = "$SOURCE_EDGE_FUNCTIONS" ] && [ "$TARGET_EDGE_FUNCTIONS" != "?" ] && [ "$TARGET_EDGE_FUNCTIONS" != "0" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
# Edge function secrets
printf "│ %-23s │ %12s │ %12s │" "Edge Function Secrets" "$SOURCE_EDGE_SECRETS" "$TARGET_EDGE_SECRETS"
if [ "$TARGET_EDGE_SECRETS" = "$SOURCE_EDGE_SECRETS" ] && [ "$TARGET_EDGE_SECRETS" != "?" ] && [ "$TARGET_EDGE_SECRETS" != "0" ]; then
    echo -e " ${GREEN}✓${NC}     │"
else
    echo -e " ${RED}✗${NC}     │"
fi
echo "└─────────────────────────┴──────────────┴──────────────┴─────────┘"
echo ""

# Show warning if critical trigger is missing
if [ "$TARGET_AUTH_USER_TRIGGER" != "Yes" ]; then
    echo -e "${RED}⚠️  CRITICAL: on_auth_user_created trigger is MISSING${NC}"
    echo -e "${RED}  This trigger is required for automatic profile creation when users sign up.${NC}"
    echo -e "${YELLOW}  The onboarding process should have created this trigger.${NC}"
    echo ""
fi

echo -e "${GREEN}✓ Client onboarding complete!${NC}"
echo ""
echo "Project Details:"
echo "  Project Ref: ${PROJECT_REF}"
echo "  Client Name: ${CLIENT_NAME}"
echo "  Client Domain: ${CLIENT_DOMAIN}"
echo "  Environment: ${ENVIRONMENT}"
echo "  Data Type: ${DATA_TYPE}"
echo "  Region: ${REGION}"
echo "  Supabase URL: https://${PROJECT_REF}.supabase.co"
echo "  Site URL: https://${CLIENT_DOMAIN}"
echo ""

# Get anon key from Supabase
echo -e "${GREEN}Getting API keys...${NC}"
ANON_KEY=$(supabase projects api-keys --project-ref ${PROJECT_REF} | grep 'anon' | awk '{print $3}')

if [ -z "$ANON_KEY" ]; then
    echo -e "${YELLOW}Warning: Could not retrieve anon key automatically${NC}"
    echo "Please get the anon key from Supabase Dashboard → Settings → API"
    ANON_KEY="<get-from-supabase-dashboard>"
fi
# Configure Supabase Auth Settings (skip for now as CLI doesn't support it)
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚠️  MANUAL CONFIGURATION REQUIRED: Auth Settings${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Configure the following in Supabase Dashboard → Authentication → URL Configuration:${NC}"
echo -e "${GREEN}  Dashboard URL: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration${NC}"
echo ""
echo -e "${YELLOW}Site URL:${NC}"
echo -e "  https://${CLIENT_DOMAIN}"
echo ""
echo -e "${YELLOW}Redirect URLs (add each on a new line):${NC}"
if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo -e "  https://${CLIENT_DOMAIN}/reset-password"
    echo -e "  https://${CLIENT_DOMAIN}/activate-account"
    echo -e "${YELLOW}Note: For single-client environments, URLs don't need /${CLIENT_NAME} prefix${NC}"
else
    echo -e "  https://${CLIENT_DOMAIN}/reset-password"
    echo -e "  https://${CLIENT_DOMAIN}/activate-account"
    echo -e "${YELLOW}Note: For production, CLIENT_DOMAIN already includes /${CLIENT_NAME}${NC}"
fi
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo ""
echo "=== CLIENT CONFIGURATION FOR VERCEL ==="
echo ""

# Determine if this is a single-client environment (dev/staging) or multi-client (production)
if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "staging" ]; then
    # Single-client environment: Use "default" so root path (/) works without /dev or /staging
    echo "⚠️  SINGLE-CLIENT ENVIRONMENT (${ENVIRONMENT})"
    echo "   For dev/staging, use 'default' client so root path (/) works without /${CLIENT_NAME}"
    echo ""
    echo "=== SINGLE-CLIENT CONFIG (Use 'default' for Root Path Access) ==="
    echo "This allows access at https://${CLIENT_DOMAIN} without /${CLIENT_NAME} in the URL:"
    # For staging/dev, use ENVIRONMENT as displayName (more meaningful than CLIENT_NAME which defaults to ENVIRONMENT anyway)
    DISPLAY_NAME="${ENVIRONMENT}"
    echo "{\"default\": {\"clientId\":\"default\",\"supabaseUrl\":\"https://${PROJECT_REF}.supabase.co\",\"supabaseAnonKey\":\"${ANON_KEY}\",\"displayName\":\"${DISPLAY_NAME}\"}}"
    echo ""
    echo "✓ Root path (/) will work: https://${CLIENT_DOMAIN}"
    echo "✓ No need for /${CLIENT_NAME} in the URL"
else
    # Multi-client production: Do NOT use "default" to prevent root path access
    echo "⚠️  MULTI-CLIENT PRODUCTION ENVIRONMENT"
    echo "   Do NOT use 'default' client - require explicit client path (e.g., /rayn)"
    echo ""
    echo "=== CONFIG FOR THIS CLIENT (${CLIENT_NAME}) ==="
    echo "Use this JSON configuration for the ${CLIENT_NAME} client:"
    echo "{\"${CLIENT_NAME}\": {\"clientId\":\"${CLIENT_NAME}\",\"supabaseUrl\":\"https://${PROJECT_REF}.supabase.co\",\"supabaseAnonKey\":\"${ANON_KEY}\",\"displayName\":\"${CLIENT_NAME}\"}}"
    echo ""
    echo "✓ Access URL: https://${CLIENT_DOMAIN}"
    echo "✓ Root path (/) will show error - prevents accidental access"
    echo ""
    echo "=== EXAMPLE: MERGING MULTIPLE CLIENTS ==="
    echo "If you already have other production clients (e.g., 'rayn'), merge this client with them:"
    echo "{\"rayn\":{\"clientId\":\"rayn\",\"supabaseUrl\":\"https://<rayn-project>.supabase.co\",\"supabaseAnonKey\":\"<rayn-anon-key>\",\"displayName\":\"rayn\"},\"${CLIENT_NAME}\":{\"clientId\":\"${CLIENT_NAME}\",\"supabaseUrl\":\"https://${PROJECT_REF}.supabase.co\",\"supabaseAnonKey\":\"${ANON_KEY}\",\"displayName\":\"${CLIENT_NAME}\"}}"
    echo ""
    echo "⚠️  CRITICAL: Never use 'default' client in production config"
    echo "    This would allow root path (/) to access production databases"
fi
echo ""
echo "To add this client to an existing configuration, merge the JSON above."
echo ""

# Special instructions for master environment (requires new Vercel project)
if [ "$CLIENT_NAME" = "master" ]; then
    echo "=== VERCEL PROJECT SETUP FOR MASTER ==="
    echo ""
    echo "⚠️  Master requires a NEW Vercel project (separate from dev/staging/prod)"
    echo ""
    echo "Steps to create Vercel project for master:"
    echo ""
    echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
    echo "2. Click 'Add New...' → 'Project'"
    echo ""
    echo "3. IMPORTANT: Select the correct repository"
    echo "   • Repository Name: staysecure-learn"
    echo "   • Repository Owner: kahuna-rayn (or your organization)"
    echo "   • Verify: This should be the SAME repository used for dev/staging projects"
    echo "   • If you don't see it, click 'Adjust GitHub App Permissions' and ensure"
    echo "     the repository is accessible"
    echo ""
    echo "4. Configure project settings:"
    echo "   • Project Name: master-staysecure-learn"
    echo "     ⚠️  CRITICAL: Use exactly 'master-staysecure-learn' (no spaces, lowercase)"
    echo "     This ensures consistency with dev/staging naming conventions"
    echo ""
    echo "   • Framework Preset: Vite (should auto-detect)"
    echo "   • Root Directory: ./ (leave as default)"
    echo "   • Build Command: npm run build (should auto-detect)"
    echo "   • Output Directory: dist (should auto-detect)"
    echo "   • Install Command: npm install (should auto-detect)"
    echo ""
    echo "   ⚠️  IMPORTANT: Configure Production Branch"
    echo "   • After creating the project, go to Project Settings → Environments"
    echo "   • Click on 'Production' environment"
    echo "   • Under 'Branch Tracking' section, click the branch dropdown"
    echo "   • Change from 'main' to '${ENVIRONMENT}' (dev or staging)"
    echo "   • This ensures master deploys from the same branch as dev/staging"
    echo "   • The text should read: 'Every commit pushed to the \`${ENVIRONMENT}\` branch"
    echo "     will create a Production Deployment.'"
    echo ""
    echo "5. Add Environment Variables (BEFORE first deployment):"
    echo "   Click 'Environment Variables' and add:"
    echo ""
    echo "   Variable: VITE_SUPABASE_URL"
    echo "   Value: https://${PROJECT_REF}.supabase.co"
    echo "   Environment: Production, Preview, Development (select all)"
    echo ""
    echo "   Variable: VITE_SUPABASE_ANON_KEY"
    echo "   Value: ${ANON_KEY}"
    echo "   Environment: Production, Preview, Development (select all)"
    echo ""
    echo "   Variable: VITE_CLIENT_CONFIGS"
    echo "   Value: {\"default\":{\"clientId\":\"default\",\"supabaseUrl\":\"https://${PROJECT_REF}.supabase.co\",\"supabaseAnonKey\":\"${ANON_KEY}\",\"displayName\":\"Master\"}}"
    echo "   Environment: Production, Preview, Development (select all)"
    echo ""
    echo "6. Click 'Deploy' to create and deploy the project"
    echo ""
    echo "7. After deployment, configure domain:"
    echo "   • Go to Project Settings → Domains"
    echo "   • Click 'Add' and enter: master.staysecure-learn.raynsecure.com"
    echo "   • Follow DNS configuration instructions (add CNAME record)"
    echo "   • Wait for DNS propagation (may take a few minutes)"
    echo ""
    echo "8. Verify deployment and branch configuration:"
    echo "   • Check that project name is: master-staysecure-learn"
    echo "   • Check that repository is: staysecure-learn"
    echo "   • Check that domain is configured: master.staysecure-learn.raynsecure.com"
    echo ""
    echo "   ⚠️  CRITICAL: Verify Production Branch is Correct"
    echo "   • Go to: Project Settings → Environments → Production"
    echo "   • Under 'Branch Tracking', verify it shows: 'Every commit pushed to the \`${ENVIRONMENT}\` branch'"
    echo "   • If it shows 'main' branch, change it to '${ENVIRONMENT}'"
    echo ""
    echo "   • Check current deployment branch:"
    echo "     - Go to: Deployments tab"
    echo "     - Click on the latest Production deployment"
    echo "     - Look at 'Git Commit' section - it should show branch: '${ENVIRONMENT}'"
    echo "     - The commit SHA should match a commit from the '${ENVIRONMENT}' branch"
    echo ""
    echo "   • To verify in Git:"
    echo "     git log --oneline ${ENVIRONMENT} | head -5"
    echo "     Compare the commit SHA with what Vercel shows"
    echo ""
    echo "   • If wrong branch is deployed:"
    echo "     1. Fix branch in Settings → Environments → Production"
    echo "     2. Trigger a new deployment by pushing to ${ENVIRONMENT} branch"
    echo "     3. Or manually redeploy: Deployments → '...' menu → 'Redeploy'"
    echo ""
    echo "   • Test access at: https://master.staysecure-learn.raynsecure.com"
    echo ""
    echo "Note: Master uses the same codebase as dev/staging, just with different"
    echo "      environment variables pointing to the master Supabase project."
    echo ""
fi

echo "Next steps:"
echo "  1. Configure Auth Settings in Supabase Dashboard:"
echo "     • Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration"
echo "     • Set Site URL to: https://${CLIENT_DOMAIN}"
echo "     • Add Redirect URLs (one per line):"
if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "       - https://${CLIENT_DOMAIN}/reset-password"
    echo "       - https://${CLIENT_DOMAIN}/activate-account"
else
    echo "       - https://${CLIENT_DOMAIN}/reset-password"
    echo "       - https://${CLIENT_DOMAIN}/activate-account"
fi
echo "  2. Copy the client configuration JSON above"
echo "  3. Update Vercel environment variable VITE_CLIENT_CONFIGS"
if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "     • Use 'default' client for single-client environment"
    echo "     • Root path (/) will work at: https://${CLIENT_DOMAIN}"
else
    echo "     • Merge with existing clients if needed"
    echo "     • Ensure there is NO 'default' client in production"
fi
echo "  4. Redeploy Vercel project"
if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "  5. Test access at: https://${CLIENT_DOMAIN} (root path should work)"
else
    echo "  5. Test access at: https://${CLIENT_DOMAIN}"
    echo "  6. Verify root path (/) shows error (this is expected and correct)"
fi
echo "  $(if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "staging" ]; then echo "7"; else echo "6"; fi). Test user creation and email sending"

