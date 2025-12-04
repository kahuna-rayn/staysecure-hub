#!/bin/bash

# Restore Seed Data Script
# Restores seed/reference data from seed.dump or seed.sql to a target database
#
# Seed data includes (reference/template data only):
# - languages (reference data)
# - email_templates, email_layouts, email_preferences (template/preference data)
# - learning_tracks, learning_track_lessons (reference content)
# - lesson_nodes, lesson_answers, lesson_translations, etc. (reference content)
# - template_variables, template_variable_translations (reference data)
#
# Excluded (user-specific data, not seed):
# - email_notifications (user-specific notifications)
# - learning_track_assignments, learning_track_department_assignments, learning_track_role_assignments (user-specific)
# - user_learning_track_progress, user_lesson_progress (user-specific)
# - lesson_reminder_counts, lesson_reminder_history (user-specific)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SEED_DUMP=${1:-"backups/seed.dump"}
PROJECT_REF=${2:-${DEV_PROJECT_REF:-"cleqfnrbiqpxpzxkatda"}}

# Determine if input is a .dump (custom format) or .sql file
if [ ! -f "$SEED_DUMP" ]; then
    echo -e "${RED}Error: Seed dump file not found: ${SEED_DUMP}${NC}"
    echo "Usage: ./restore-seed-data.sh [seed-dump-path] [project-ref]"
    echo "Example: ./restore-seed-data.sh backups/seed.dump cleqfnrbiqpxpzxkatda"
    echo ""
    echo "  seed-dump-path: Path to seed.dump or seed.sql file (default: backups/seed.dump)"
    echo "  project-ref: Target Supabase project reference where data will be restored"
    echo "               (default: cleqfnrbiqpxpzxkatda or DEV_PROJECT_REF env var)"
    echo ""
    echo "Note: Uses dev database (cleqfnrbiqpxpzxkatda) as default target."
    echo "      PGPASSWORD should be set to the TARGET database password (not source)."
    exit 1
fi

# Check file extension to determine format
if [[ "$SEED_DUMP" == *.dump ]]; then
    FORMAT="custom"
elif [[ "$SEED_DUMP" == *.sql ]]; then
    FORMAT="sql"
else
    echo -e "${RED}Error: Unsupported file format. Expected .dump or .sql${NC}"
    exit 1
fi

echo -e "${GREEN}Restoring seed data from ${SEED_DUMP}...${NC}"
echo -e "${GREEN}Using PROJECT_REF: ${PROJECT_REF}${NC}"
echo -e "${YELLOW}Note: This will restore to the target database (${PROJECT_REF})${NC}"
echo -e "${YELLOW}      Use the password for the TARGET database, not the source${NC}"

# Get database password from environment variable or prompt
# IMPORTANT: This is the password for the TARGET database (where we're restoring TO)
if [ -z "$PGPASSWORD" ]; then
    echo "Enter database password for ${PROJECT_REF} (target database):"
    read -s DB_PASSWORD
    export PGPASSWORD="$DB_PASSWORD"
else
    echo "Using database password from PGPASSWORD environment variable"
fi

# Use pooler connection (port 6543) for database operations, matching onboard script
CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=6543 user=postgres dbname=postgres sslmode=require"

# Verify seed file contains data
if [ "$FORMAT" = "custom" ]; then
    TABLE_COUNT=$(pg_restore --list "$SEED_DUMP" 2>/dev/null | grep -c "TABLE DATA" || echo "0")
    if [ "$TABLE_COUNT" -eq 0 ]; then
        echo -e "${RED}Error: Seed dump file appears to be empty (no TABLE DATA entries found)${NC}"
        exit 1
    fi
    echo -e "${GREEN}Found ${TABLE_COUNT} tables in seed dump${NC}"
    
    # Show which tables will be restored
    echo -e "${GREEN}Tables to restore:${NC}"
    pg_restore --list "$SEED_DUMP" 2>/dev/null | \
        grep "TABLE DATA public" | \
        sed 's/.*TABLE DATA public \([^ ]*\).*/  - \1/' | sort
fi

# Restore seed data
if [ "$FORMAT" = "custom" ]; then
    echo -e "${GREEN}Restoring seed data from custom format dump...${NC}"
    echo -e "${YELLOW}Note: Some errors are expected and can be ignored:${NC}"
    echo -e "${YELLOW}  - System trigger permission errors (RI_ConstraintTrigger)${NC}"
    echo -e "${YELLOW}  - Duplicate key violations (if data already exists)${NC}"
    echo -e "${YELLOW}  - Foreign key violations for user-related tables (users/profiles not in seed data)${NC}"
    echo ""
    pg_restore \
        --host=db.${PROJECT_REF}.supabase.co \
        --port=6543 \
        --user=postgres \
        --dbname=postgres \
        --verbose \
        --no-owner \
        --data-only \
        "$SEED_DUMP" 2>&1 | tee /tmp/restore-seed.log || {
            echo ""
            echo -e "${YELLOW}Analyzing restore errors...${NC}"
            
            # Count different types of errors
            SYSTEM_TRIGGER_ERRORS=$(grep -c "permission denied.*RI_ConstraintTrigger" /tmp/restore-seed.log || echo "0")
            DUPLICATE_KEY_ERRORS=$(grep -c "duplicate key value violates unique constraint" /tmp/restore-seed.log || echo "0")
            FOREIGN_KEY_ERRORS=$(grep -c "violates foreign key constraint" /tmp/restore-seed.log || echo "0")
            OTHER_ERRORS=$(grep "ERROR" /tmp/restore-seed.log | grep -v "permission denied.*RI_ConstraintTrigger" | grep -v "duplicate key value" | grep -v "violates foreign key constraint" | wc -l | tr -d ' ')
            
            if [ "$SYSTEM_TRIGGER_ERRORS" -gt "0" ]; then
                echo -e "${GREEN}  ✓ ${SYSTEM_TRIGGER_ERRORS} system trigger errors (expected, can be ignored)${NC}"
            fi
            if [ "$DUPLICATE_KEY_ERRORS" -gt "0" ]; then
                echo -e "${GREEN}  ✓ ${DUPLICATE_KEY_ERRORS} duplicate key errors (expected if data already exists)${NC}"
            fi
            if [ "$FOREIGN_KEY_ERRORS" -gt "0" ]; then
                echo -e "${YELLOW}  ⚠ ${FOREIGN_KEY_ERRORS} foreign key errors (expected for user-related tables)${NC}"
            fi
            if [ "$OTHER_ERRORS" -gt "0" ]; then
                echo -e "${RED}  ✗ ${OTHER_ERRORS} other errors (may need attention)${NC}"
                echo -e "${YELLOW}Review /tmp/restore-seed.log for details${NC}"
            fi
        }
else
    echo -e "${GREEN}Restoring seed data from SQL format...${NC}"
    psql "${CONNECTION_STRING}" \
        --single-transaction \
        --variable ON_ERROR_STOP=0 \
        --command 'SET session_replication_role = replica' \
        --file "$SEED_DUMP" 2>&1 | tee /tmp/restore-seed.log || {
            echo -e "${YELLOW}Some errors occurred during SQL restore${NC}"
            echo -e "${YELLOW}Review /tmp/restore-seed.log for details${NC}"
        }
fi

# Verify restoration by checking a key table (languages)
echo -e "${GREEN}Verifying restoration...${NC}"
LANGUAGE_COUNT=$(psql "${CONNECTION_STRING}" -tAc "SELECT COUNT(*) FROM public.languages WHERE is_active = true;" 2>/dev/null || echo "0")

if [ "$LANGUAGE_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ Seed data restored successfully${NC}"
    echo -e "${GREEN}  Found ${LANGUAGE_COUNT} active languages in database${NC}"
else
    echo -e "${YELLOW}Warning: languages table appears empty or verification failed${NC}"
    echo -e "${YELLOW}  This may indicate the restore had issues${NC}"
fi

echo ""
echo -e "${GREEN}✓ Seed data restoration complete!${NC}"
echo "Log file: /tmp/restore-seed.log"

