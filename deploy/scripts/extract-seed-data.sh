#!/bin/bash

# Extract Seed Data from Demo Dump
# Extracts seed/reference data tables from demo.dump into seed.dump
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

DEMO_DUMP=${1:-"backups/demo.dump"}
OUTPUT_DIR=${2:-"backups"}
SEED_DUMP="${OUTPUT_DIR}/seed.dump"
SCHEMA_DUMP="${OUTPUT_DIR}/schema.dump"

if [ ! -f "$DEMO_DUMP" ]; then
    echo -e "${RED}Error: Demo dump file not found: ${DEMO_DUMP}${NC}"
    echo "Usage: ./extract-seed-data.sh [demo-dump-path] [output-dir] [project-ref]"
    echo "Example: ./extract-seed-data.sh backups/demo.dump backups"
    echo ""
    echo "  demo-dump-path: Path to demo.dump file (default: backups/demo.dump)"
    echo "  output-dir: Output directory (default: backups)"
    echo "  project-ref: Supabase project reference (default: cleqfnrbiqpxpzxkatda or DEV_PROJECT_REF env var)"
    echo ""
    echo "Note: Uses dev database (cleqfnrbiqpxpzxkatda) as default for temporary database operations."
    exit 1
fi

if [ ! -f "$SCHEMA_DUMP" ]; then
    echo -e "${RED}Error: Schema dump file not found: ${SCHEMA_DUMP}${NC}"
    echo "The schema.dump file is required to restore table definitions."
    echo "Please ensure backups/schema.dump exists (created by create-backup.sh)."
    exit 1
fi

echo -e "${GREEN}Extracting seed data from ${DEMO_DUMP}...${NC}"

# Create output directory
mkdir -p ${OUTPUT_DIR}

# Get database password from environment variable or prompt
if [ -z "$PGPASSWORD" ]; then
    echo "Enter database password (for temporary database operations):"
    read -s DB_PASSWORD
    export PGPASSWORD="$DB_PASSWORD"
else
    echo "Using database password from PGPASSWORD environment variable"
fi

# We need a temporary database to restore to, then dump from
# Use the same connection details as create-backup.sh expects
# Default to dev database PROJECT_REF if available, or use dev project ref
PROJECT_REF=${3:-${DEV_PROJECT_REF:-"cleqfnrbiqpxpzxkatda"}}
echo -e "${GREEN}Using PROJECT_REF: ${PROJECT_REF}${NC}"
EXTRACT_TO_SQL=false
# Use direct connection (port 5432) for database operations, not pooler (6543)
CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=5432 user=postgres dbname=postgres sslmode=require"

# Create TOC file with only seed data tables
TOC_FILE=$(mktemp)
TOC_DATA_FILE=$(mktemp)
echo -e "${GREEN}Filtering tables from demo.dump...${NC}"

# Get list of seed table names first
# Exclude user-specific tables (assignments, progress, notifications, reminders)
# Seed data should only include reference/template data, not user-specific records
SEED_TABLES=$(pg_restore --list "$DEMO_DUMP" 2>/dev/null | \
    grep "TABLE DATA public" | \
    grep -E "(email_|TABLE DATA public languages|learning_|lesson_|template_)" | \
    grep -v "user_learning_track_progress\|user_lesson_progress" | \
    grep -v "learning_track_assignments\|learning_track_department_assignments\|learning_track_role_assignments" | \
    grep -v "email_notifications" | \
    grep -v "lesson_reminder_counts\|lesson_reminder_history" | \
    sed 's/.*TABLE DATA public \([^ ]*\).*/\1/' | sort -u)

if [ -z "$SEED_TABLES" ]; then
    echo -e "${RED}Error: No seed data tables found in ${DEMO_DUMP}${NC}"
    echo "Make sure the dump contains tables matching: email_*, languages, learning_*, lesson_*, template_*"
    rm -f "${TOC_FILE}" "${TOC_DATA_FILE}"
    exit 1
fi

# Count tables found
TABLE_COUNT=$(echo "$SEED_TABLES" | wc -l | tr -d ' ')
echo -e "${GREEN}Found ${TABLE_COUNT} seed data tables${NC}"

# Show which tables will be extracted
echo -e "${GREEN}Tables to extract:${NC}"
echo "$SEED_TABLES" | sed 's/^/  - /'

# Create TOC for schema (all tables, but we'll restore only seed data)
# First, restore full schema to temp database, then restore only seed data
SCHEMA_TOC=$(mktemp)
# Get all TABLE entries (schema) - we need the full schema for foreign keys
pg_restore --list "$DEMO_DUMP" 2>/dev/null | \
    grep -E "^\s*[0-9]+;\s+[0-9]+\s+[0-9]+\s+TABLE public " > "${SCHEMA_TOC}" || true

# Create TOC for seed data only
for table in $SEED_TABLES; do
    pg_restore --list "$DEMO_DUMP" 2>/dev/null | \
        grep -E "^\s*[0-9]+;\s+[0-9]+\s+[0-9]+\s+TABLE DATA public ${table}\s" >> "${TOC_DATA_FILE}" || true
done

# Extract to custom format (requires temporary database)
echo -e "${GREEN}Extracting to custom format: ${SEED_DUMP}${NC}"
echo -e "${YELLOW}Note: This requires a temporary database connection to ${PROJECT_REF}${NC}"

# Create a temporary database or use existing one
TEMP_DB="temp_seed_extract_$$"

# Restore seed data to temporary database
echo -e "${GREEN}Restoring seed data to temporary database...${NC}"
psql "${CONNECTION_STRING}" \
    --command "CREATE DATABASE ${TEMP_DB};" 2>&1 || {
        echo -e "${YELLOW}Database may already exist, continuing...${NC}"
    }

TEMP_CONNECTION="host=db.${PROJECT_REF}.supabase.co port=5432 user=postgres dbname=${TEMP_DB} sslmode=require"

# Restore schema first from schema.dump, then data from demo.dump
# This ensures tables exist before data is loaded
echo -e "${GREEN}Restoring schema from ${SCHEMA_DUMP} to temporary database...${NC}"
pg_restore \
    --dbname="${TEMP_CONNECTION}" \
    --no-owner \
    --no-acl \
    "$SCHEMA_DUMP" 2>&1 | tee /tmp/restore_schema.log | grep -E "(CREATE TABLE|CREATE TYPE|error|ERROR)" | tail -30 || {
        echo -e "${YELLOW}Some warnings during schema restore (may be expected)${NC}"
    }

# Verify seed tables exist after schema restore
echo -e "${GREEN}Verifying seed tables exist after schema restore...${NC}"
MISSING_TABLES=""
for table in $SEED_TABLES; do
    TABLE_EXISTS=$(psql "${TEMP_CONNECTION}" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}');" 2>/dev/null || echo "f")
    if [ "$TABLE_EXISTS" != "t" ]; then
        MISSING_TABLES="${MISSING_TABLES} ${table}"
        echo -e "${YELLOW}Table ${table} not found after schema restore${NC}"
    fi
done

if [ -n "$MISSING_TABLES" ]; then
    echo -e "${RED}Error: The following seed tables do not exist after schema restore:${NC}"
    echo "$MISSING_TABLES"
    echo -e "${RED}This may indicate the demo.dump does not contain these table definitions.${NC}"
    echo -e "${YELLOW}Attempting to restore data anyway...${NC}"
fi

# Now restore data
echo -e "${GREEN}Restoring data to temporary database...${NC}"
pg_restore \
    --dbname="${TEMP_CONNECTION}" \
    --data-only \
    --no-owner \
    --no-acl \
    --disable-triggers \
    "$DEMO_DUMP" 2>&1 | tee /tmp/restore_data.log | grep -E "(COPY|error|ERROR)" | tail -30 || {
        echo -e "${YELLOW}Some warnings during data restore (may be expected)${NC}"
    }

# Dump only seed tables from temp database to seed.dump
echo -e "${GREEN}Creating seed.dump from temporary database (seed tables only)...${NC}"

# Build --table arguments for each seed table
TABLE_ARGS=""
for table in $SEED_TABLES; do
    TABLE_ARGS="${TABLE_ARGS} --table=public.${table}"
done

pg_dump \
    --host=db.${PROJECT_REF}.supabase.co \
    --port=5432 \
    --user=postgres \
    --dbname=${TEMP_DB} \
    --data-only \
    --format=custom \
    --no-owner \
    ${TABLE_ARGS} \
    --file="${SEED_DUMP}" \
    --verbose 2>&1 | tail -20

# Clean up temporary database
echo -e "${GREEN}Cleaning up temporary database...${NC}"
psql "${CONNECTION_STRING}" \
    --command "DROP DATABASE IF EXISTS ${TEMP_DB};" 2>&1 || true

echo -e "${GREEN}✓ Seed data extracted to ${SEED_DUMP}${NC}"

rm -f "${TOC_FILE}" "${TOC_DATA_FILE}" "${SCHEMA_TOC}" /tmp/restore_errors.log

echo ""
echo -e "${GREEN}✓ Seed data extraction complete!${NC}"
echo "Files:"
echo "  - ${SEED_DUMP}"

