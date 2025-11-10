#!/bin/bash

# Client Onboarding Script
# Automates the creation of a new Supabase project with all required configuration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-prod}  # prod, staging, dev
CLIENT_NAME_PARAM=${2:-""}

# Base domain for all clients
BASE_DOMAIN="staysecure-learn.raynsecure.com"

# Parse optional parameters
# For staging/dev: position 2 might be DATA_TYPE (demo/seed) or CLIENT_NAME
# For prod: position 2 is always CLIENT_NAME, position 3 might be DATA_TYPE or CLIENT_DOMAIN
if [ "$ENVIRONMENT" = "staging" ] || [ "$ENVIRONMENT" = "dev" ]; then
    # For staging/dev, check if position 2 is a data type (demo/seed)
    if [ "$CLIENT_NAME_PARAM" = "demo" ] || [ "$CLIENT_NAME_PARAM" = "seed" ]; then
        # Position 2 is DATA_TYPE, CLIENT_NAME will default to ENVIRONMENT
        CLIENT_NAME=""
        DATA_TYPE=${CLIENT_NAME_PARAM}
        CLIENT_DOMAIN=""
        REGION=${3:-ap-southeast-1}
    elif [[ "${CLIENT_NAME_PARAM}" == *"/"* ]]; then
        # Position 2 is CLIENT_DOMAIN (contains '/')
        CLIENT_NAME=""
        CLIENT_DOMAIN=${CLIENT_NAME_PARAM}
        DATA_TYPE=${3:-seed}
        REGION=${4:-ap-southeast-1}
    else
        # Position 2 is CLIENT_NAME (explicitly provided)
        CLIENT_NAME=${CLIENT_NAME_PARAM}
        # Check if position 3 looks like a domain or is data type
        if [[ "${3:-}" == *"/"* ]]; then
            CLIENT_DOMAIN=${3:-""}
            DATA_TYPE=${4:-seed}
            REGION=${5:-ap-southeast-1}
        else
            CLIENT_DOMAIN=""
            DATA_TYPE=${3:-seed}
            REGION=${4:-ap-southeast-1}
        fi
    fi
else
    # For prod: position 2 is CLIENT_NAME (required)
    CLIENT_NAME=${CLIENT_NAME_PARAM}
    # Check if position 3 looks like a domain (contains '/') or is data type
    if [[ "${3:-}" == *"/"* ]]; then
        # Position 3 is CLIENT_DOMAIN
        CLIENT_DOMAIN=${3:-""}
        DATA_TYPE=${4:-seed}
        REGION=${5:-ap-southeast-1}
    else
        # Position 3 is DATA_TYPE (CLIENT_DOMAIN will be auto-constructed)
        CLIENT_DOMAIN=""
        DATA_TYPE=${3:-seed}
        REGION=${4:-ap-southeast-1}
    fi
fi

# For staging/dev environments, default CLIENT_NAME to ENVIRONMENT if not provided
# For prod, CLIENT_NAME is required
if [ -z "$CLIENT_NAME" ]; then
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${RED}Error: Client name is required for production environment${NC}"
        echo "Usage: ./onboard-client.sh [prod|staging|dev] <client-name> [client-domain] [data-type] [region]"
        echo "Example: ./onboard-client.sh prod rayn [data-type] [region]"
        echo "Example: ./onboard-client.sh prod client1 seed"
        echo "Note: client-domain defaults to staysecure-learn.raynsecure.com/<client-name> if not provided"
        exit 1
    else
        # Default to ENVIRONMENT name for staging/dev (so staging -> "staging", dev -> "dev")
        CLIENT_NAME="$ENVIRONMENT"
        echo -e "${YELLOW}Note: Client name not provided, defaulting to '${ENVIRONMENT}' for ${ENVIRONMENT} environment${NC}"
    fi
fi

# Auto-construct CLIENT_DOMAIN from CLIENT_NAME if not provided
if [ -z "$CLIENT_DOMAIN" ]; then
    # For dev/staging: use subdomain format (dev.staysecure-learn.raynsecure.com)
    # For prod: use path format (staysecure-learn.raynsecure.com/<client-name>)
    if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "staging" ]; then
        CLIENT_DOMAIN="${ENVIRONMENT}.${BASE_DOMAIN}"
    else
        # Production: use path format
        CLIENT_DOMAIN="${BASE_DOMAIN}/${CLIENT_NAME}"
    fi
    echo -e "${YELLOW}Note: Client domain not provided, auto-constructed as: ${CLIENT_DOMAIN}${NC}"
fi

# Validate data type
if [ "$DATA_TYPE" != "seed" ] && [ "$DATA_TYPE" != "demo" ]; then
    echo -e "${RED}Error: Data type must be 'seed' or 'demo'${NC}"
    echo "Usage: ./onboard-client.sh [prod|staging|dev] <client-name> [client-domain] [data-type] [region]"
    echo "  client-name: Required for prod, optional for staging/dev (defaults to environment name)"
    echo "  client-domain: Optional, defaults to staysecure-learn.raynsecure.com/<client-name>"
    echo "  data-type: 'seed' for new clients (schema + reference data only)"
    echo "            'demo' for internal/demo (schema + all data including users)"
    exit 1
fi

echo -e "${GREEN}Onboarding client: ${CLIENT_NAME} in ${ENVIRONMENT} environment${NC}"

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

# Determine project name: if CLIENT_NAME equals ENVIRONMENT, just use CLIENT_NAME
# Otherwise use CLIENT_NAME-ENVIRONMENT format
if [ "$CLIENT_NAME" = "$ENVIRONMENT" ]; then
    PROJECT_NAME="${CLIENT_NAME}"
else
    PROJECT_NAME="${CLIENT_NAME}-${ENVIRONMENT}"
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

# Link to the project (now that it's ready)
echo -e "${GREEN}Linking to project...${NC}"
supabase link --project-ref ${PROJECT_REF}

# Prepare direct Postgres connection string (bypass pooler for admin operations)
CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"

# Restore from backup (if available) or apply schema files
# Check for custom format dumps first, then fall back to SQL format
if [ -f "backups/schema.dump" ]; then
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
    # Note: --clean --if-exists may show errors on fresh databases (trying to drop non-existent objects)
    # These errors are safe to ignore, but we'll capture them in the log
    pg_restore --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
        --dbname=postgres \
        --verbose \
        --no-owner \
        --clean \
        --if-exists \
        backups/schema.dump 2>&1 | tee /tmp/restore-schema.log || {
            echo -e "${RED}Failed to restore schema${NC}"
            exit 1
        }
    
    # Restore storage schema if it exists
    if [ -f "backups/storage.dump" ]; then
        echo -e "${GREEN}Restoring storage schema...${NC}"
        pg_restore --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
            --dbname=postgres \
            --verbose \
            --no-owner \
            --clean \
            --if-exists \
            backups/storage.dump 2>&1 | tee /tmp/restore-storage.log || {
                echo -e "${YELLOW}Warning: Storage schema restore had issues (may be expected)${NC}"
            }
    fi
    
    # Create avatars bucket if it doesn't exist (buckets are not always included in storage.dump)
    echo -e "${GREEN}Ensuring avatars bucket exists...${NC}"
    psql "${CONNECTION_STRING}" \
        --command "INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;" || {
        echo -e "${YELLOW}Warning: Failed to create avatars bucket (may already exist)${NC}"
    }
    
    # Restore data based on type (using custom format if available, otherwise SQL)
    if [ "$DATA_TYPE" = "demo" ] && [ -f "backups/demo.dump" ]; then
        echo -e "${GREEN}Restoring demo data (excluding auth.users and user_roles)...${NC}"
        
        # Restore profiles first (with FK checks disabled - profiles.id references auth.users.id but we won't restore auth.users)
        # session_replication_role = replica allows FK violations during restore
        echo -e "${GREEN}Restoring profiles...${NC}"
        pg_restore --no-owner --data-only --table=public.profiles backups/demo.dump 2>/dev/null | \
        psql --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
            --dbname=postgres \
            --variable ON_ERROR_STOP=0 \
            --command 'SET session_replication_role = replica' \
            --file /dev/stdin 2>&1 | tee /tmp/restore-profiles.log || {
                echo -e "${YELLOW}Warning: Some errors restoring profiles (may be expected)${NC}"
            }
        
        # Restore all other demo data (excluding profiles, user_roles, and auth.users)
        # Note: created_by/updated_by columns allow NULL, so we'll set them to NULL after restore
        echo -e "${GREEN}Restoring remaining demo data...${NC}"
        pg_restore --no-owner --data-only --exclude-table=public.profiles --exclude-table=public.user_roles --exclude-table=auth.users backups/demo.dump 2>/dev/null | \
        psql --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
            --dbname=postgres \
            --variable ON_ERROR_STOP=0 \
            --command 'SET session_replication_role = replica' \
            --file /dev/stdin 2>&1 | tee /tmp/restore-data.log || {
                echo -e "${YELLOW}Warning: Some data restore errors occurred (may be expected for missing foreign keys)${NC}"
            }
        
        # Set all created_by and updated_by columns to NULL (since they reference auth.users which we don't restore)
        # Only update columns that actually exist in each table
        echo -e "${GREEN}Setting created_by/updated_by columns to NULL...${NC}"
        psql --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
            --dbname=postgres \
            --variable ON_ERROR_STOP=0 <<EOF 2>&1 | tee /tmp/nullify-user-refs.log
-- account_inventory: created_by, modified_by
UPDATE public.account_inventory SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE public.account_inventory SET modified_by = NULL WHERE modified_by IS NOT NULL;

-- email_layouts: created_by only
UPDATE public.email_layouts SET created_by = NULL WHERE created_by IS NOT NULL;

-- email_preferences: created_by, updated_by
UPDATE public.email_preferences SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE public.email_preferences SET updated_by = NULL WHERE updated_by IS NOT NULL;

-- email_templates: created_by only
UPDATE public.email_templates SET created_by = NULL WHERE created_by IS NOT NULL;

-- key_dates: created_by, modified_by (not updated_by)
UPDATE public.key_dates SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE public.key_dates SET modified_by = NULL WHERE modified_by IS NOT NULL;

-- learning_tracks: created_by only
UPDATE public.learning_tracks SET created_by = NULL WHERE created_by IS NOT NULL;

-- lessons: created_by, updated_by
UPDATE public.lessons SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE public.lessons SET updated_by = NULL WHERE updated_by IS NOT NULL;

-- notification_rules: created_by only
UPDATE public.notification_rules SET created_by = NULL WHERE created_by IS NOT NULL;

-- org_profile: created_by only
UPDATE public.org_profile SET created_by = NULL WHERE created_by IS NOT NULL;

-- org_sig_roles: created_by only
UPDATE public.org_sig_roles SET created_by = NULL WHERE created_by IS NOT NULL;

-- template_variables: created_by only
UPDATE public.template_variables SET created_by = NULL WHERE created_by IS NOT NULL;

-- translation_change_log: updated_by only (not created_by)
UPDATE public.translation_change_log SET updated_by = NULL WHERE updated_by IS NOT NULL;
EOF
        
        # Re-enable foreign key checks
        psql --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
            --dbname=postgres \
            --command 'SET session_replication_role = DEFAULT' > /dev/null 2>&1
        
        echo -e "${GREEN}✓ Demo data restored successfully${NC}"
    elif [ "$DATA_TYPE" = "seed" ] && [ -f "backups/seed.dump" ]; then
        echo -e "${GREEN}Restoring seed data (reference data only) from custom format...${NC}"
        pg_restore --host=db.${PROJECT_REF}.supabase.co --port=6543 --user=postgres \
            --dbname=postgres \
            --verbose \
            --no-owner \
            --data-only \
            backups/seed.dump 2>&1 | tee /tmp/restore-data.log || {
                echo -e "${RED}Failed to restore seed data${NC}"
                exit 1
            }
    elif [ "$DATA_TYPE" = "demo" ] && [ -f "backups/demo.sql" ]; then
        echo -e "${GREEN}Restoring demo data (including users) from SQL format...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --command 'SET session_replication_role = replica' \
            --file backups/demo.sql || {
                echo -e "${RED}Failed to restore demo data${NC}"
                exit 1
            }
    elif [ "$DATA_TYPE" = "seed" ] && [ -f "backups/seed.sql" ]; then
        echo -e "${GREEN}Restoring seed data (reference data only) from SQL format...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --command 'SET session_replication_role = replica' \
            --file backups/seed.sql || {
                echo -e "${RED}Failed to restore seed data${NC}"
                exit 1
            }
    else
        echo -e "${YELLOW}Warning: No data backup found (demo.dump/seed.dump or demo.sql/seed.sql), skipping data restoration${NC}"
    fi
    
    # Apply post-migration fixes (fixes that aren't in the schema dump, including RLS policies, permissions, and triggers)
    # This includes the on_auth_user_created trigger
    if [ -f "scripts/post-migration-fixes.sql" ]; then
        echo -e "${GREEN}Applying post-migration fixes...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --file scripts/post-migration-fixes.sql || {
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
elif [ -f "backups/schema.sql" ]; then
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
        --file backups/schema.sql || {
            echo -e "${RED}Failed to restore schema${NC}"
            exit 1
        }
    
    # Restore data based on type
    if [ "$DATA_TYPE" = "demo" ] && [ -f "backups/demo.sql" ]; then
        echo -e "${GREEN}Restoring demo data (including users)...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --command 'SET session_replication_role = replica' \
            --file backups/demo.sql || {
                echo -e "${RED}Failed to restore demo data${NC}"
                exit 1
            }
    elif [ "$DATA_TYPE" = "seed" ] && [ -f "backups/seed.sql" ]; then
        echo -e "${GREEN}Restoring seed data (reference data only)...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --command 'SET session_replication_role = replica' \
            --file backups/seed.sql || {
                echo -e "${RED}Failed to restore seed data${NC}"
                exit 1
            }
    else
        echo -e "${YELLOW}Warning: demo.sql not found, skipping data restoration${NC}"
    fi
    
    # Apply post-migration fixes (fixes that aren't in the schema dump, including RLS policies, permissions, and triggers)
    # This includes the on_auth_user_created trigger
    if [ -f "scripts/post-migration-fixes.sql" ]; then
        echo -e "${GREEN}Applying post-migration fixes...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --file scripts/post-migration-fixes.sql || {
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
        if [ -f "$file" ]; then
            echo "Applying $file..."
            supabase db execute --file "$file" --project-ref ${PROJECT_REF} || {
                echo -e "${RED}Failed to apply $file${NC}"
                exit 1
            }
        else
            echo -e "${YELLOW}Warning: $file not found${NC}"
        fi
    done
    
    # Apply post-migration fixes (fixes that aren't in the schema dump, including RLS policies, permissions, and triggers)
    CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"
    if [ -f "scripts/post-migration-fixes.sql" ]; then
        echo -e "${GREEN}Applying post-migration fixes...${NC}"
        psql "${CONNECTION_STRING}" \
            --single-transaction \
            --variable ON_ERROR_STOP=1 \
            --file scripts/post-migration-fixes.sql || {
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

echo -e "${GREEN}Setting Edge Function secrets...${NC}"
# Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically provided by Supabase
# and cannot be set manually (they're created when the project is created).
# Edge Functions can access them via Deno.env.get('SUPABASE_URL') and Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

supabase secrets set \
    GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY} \
    DEEPL_API_KEY=${DEEPL_API_KEY} \
    AUTH_LAMBDA_URL=${AUTH_LAMBDA_URL} \
    APP_BASE_URL=${APP_BASE_URL} \
    MANAGER_NOTIFICATION_COOLDOWN_HOURS=${MANAGER_NOTIFICATION_COOLDOWN_HOURS} \
    --project-ref ${PROJECT_REF}

# Deploy Edge Functions (not included in database dumps)
echo -e "${GREEN}Deploying Edge Functions...${NC}"
supabase functions deploy create-user --no-verify-jwt --project-ref ${PROJECT_REF}
supabase functions deploy delete-user --no-verify-jwt --project-ref ${PROJECT_REF}
supabase functions deploy send-email --no-verify-jwt --project-ref ${PROJECT_REF}
supabase functions deploy send-password-reset --no-verify-jwt --project-ref ${PROJECT_REF}
supabase functions deploy update-password --no-verify-jwt --project-ref ${PROJECT_REF}
supabase functions deploy update-user-password --no-verify-jwt --project-ref ${PROJECT_REF}
supabase functions deploy translate-lesson --no-verify-jwt --project-ref ${PROJECT_REF}
supabase functions deploy translation-status --no-verify-jwt --project-ref ${PROJECT_REF}

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
EXPECTED_FUNCTIONS=("create-user" "delete-user" "send-email" "send-password-reset" "update-password" "update-user-password" "translate-lesson" "translation-status")
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
    echo -e "  https://${CLIENT_DOMAIN}/${CLIENT_NAME}/reset-password"
    echo -e "  https://${CLIENT_DOMAIN}/${CLIENT_NAME}/activate-account"
    echo -e "${YELLOW}Note: For production, URLs require /${CLIENT_NAME} prefix${NC}"
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
    echo "=== MULTI-CLIENT CONFIG (No Default Client - Required) ==="
    echo "For production with multiple clients, use explicit client paths:"
    echo "{\"${CLIENT_NAME}\": {\"clientId\":\"${CLIENT_NAME}\",\"supabaseUrl\":\"https://${PROJECT_REF}.supabase.co\",\"supabaseAnonKey\":\"${ANON_KEY}\",\"displayName\":\"${CLIENT_NAME}\"}}"
    echo ""
    echo "✓ Access requires explicit path: https://${CLIENT_DOMAIN}/${CLIENT_NAME}"
    echo "✓ Root path (/) will show error - prevents accidental access"
    echo ""
    echo "=== MULTI-CLIENT EXAMPLE (For Multiple Production Clients) ==="
    echo "If you have multiple clients (e.g., rayn and ${CLIENT_NAME}), merge them:"
    echo "{\"rayn\":{\"clientId\":\"rayn\",\"supabaseUrl\":\"https://<rayn-project>.supabase.co\",\"supabaseAnonKey\":\"<rayn-anon-key>\",\"displayName\":\"rayn\"},\"${CLIENT_NAME}\":{\"clientId\":\"${CLIENT_NAME}\",\"supabaseUrl\":\"https://${PROJECT_REF}.supabase.co\",\"supabaseAnonKey\":\"${ANON_KEY}\",\"displayName\":\"${CLIENT_NAME}\"}}"
    echo ""
    echo "⚠️  CRITICAL: Never use 'default' client in production config"
    echo "    This would allow root path (/) to access production databases"
fi
echo ""
echo "To add this client to an existing configuration, merge the JSON above."
echo ""
echo "Next steps:"
echo "  1. Configure Auth Settings in Supabase Dashboard:"
echo "     • Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration"
echo "     • Set Site URL to: https://${CLIENT_DOMAIN}"
echo "     • Add Redirect URLs (one per line):"
if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "       - https://${CLIENT_DOMAIN}/reset-password"
    echo "       - https://${CLIENT_DOMAIN}/activate-account"
else
    echo "       - https://${CLIENT_DOMAIN}/${CLIENT_NAME}/reset-password"
    echo "       - https://${CLIENT_DOMAIN}/${CLIENT_NAME}/activate-account"
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
    echo "  5. Test access at: https://${CLIENT_DOMAIN}/${CLIENT_NAME}"
    echo "  6. Verify root path (/) shows error (this is expected and correct)"
fi
echo "  $(if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "staging" ]; then echo "7"; else echo "6"; fi). Test user creation and email sending"

