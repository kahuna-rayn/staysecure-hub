#!/bin/bash

# Extract Seed Data from Demo Dump
# Extracts seed/reference data tables from demo.dump into seed.dump
#
# Seed data includes:
# - email_* tables (email_templates, email_layouts, etc.)
# - languages
# - learning_* tables (learning_tracks, learning_track_lessons, etc.)
# - lesson_* tables (lessons, lesson_answers, etc.)
# - template_* tables (template_variables, template_variable_translations, etc.)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEMO_DUMP=${1:-"backups/demo.dump"}
OUTPUT_DIR=${2:-"backups"}
SEED_DUMP="${OUTPUT_DIR}/seed.dump"

if [ ! -f "$DEMO_DUMP" ]; then
    echo -e "${RED}Error: Demo dump file not found: ${DEMO_DUMP}${NC}"
    echo "Usage: ./extract-seed-data.sh [demo-dump-path] [output-dir] [project-ref]"
    echo "Example: ./extract-seed-data.sh backups/demo.dump backups"
    echo ""
    echo "  demo-dump-path: Path to demo.dump file (default: backups/demo.dump)"
    echo "  output-dir: Output directory (default: backups)"
    echo "  project-ref: Supabase project reference (default: uses DEV_PROJECT_REF env var)"
    echo ""
    echo "Note: If PROJECT_REF is not provided and DEV_PROJECT_REF is not set,"
    echo "      the script will extract to SQL format instead of custom format dump."
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
# Default to dev database PROJECT_REF if available
PROJECT_REF=${3:-${DEV_PROJECT_REF:-""}}
if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}Note: PROJECT_REF not provided. Will extract to SQL format instead.${NC}"
    echo -e "${YELLOW}      To create custom format dump, either:${NC}"
    echo -e "${YELLOW}      1. Set DEV_PROJECT_REF environment variable${NC}"
    echo -e "${YELLOW}      2. Provide PROJECT_REF as 3rd argument${NC}"
    EXTRACT_TO_SQL=true
else
    echo -e "${GREEN}Using PROJECT_REF: ${PROJECT_REF}${NC}"
    EXTRACT_TO_SQL=false
    # Use direct connection (port 5432) for database operations, not pooler (6543)
    CONNECTION_STRING="host=db.${PROJECT_REF}.supabase.co port=5432 user=postgres dbname=postgres sslmode=require"
fi

# Create TOC file with only seed data tables
TOC_FILE=$(mktemp)
echo -e "${GREEN}Filtering tables from demo.dump...${NC}"

# List all tables in the dump and filter for seed data patterns
pg_restore --list "$DEMO_DUMP" 2>/dev/null | \
    grep "TABLE DATA public" | \
    grep -E "(email_|^[0-9]+.*TABLE DATA public\.languages|learning_|lesson_|template_)" > "${TOC_FILE}" || {
        echo -e "${YELLOW}Warning: No matching tables found or error listing dump${NC}"
    }

# Count tables found
TABLE_COUNT=$(wc -l < "${TOC_FILE}" | tr -d ' ')
echo -e "${GREEN}Found ${TABLE_COUNT} seed data tables${NC}"

if [ "$TABLE_COUNT" -eq 0 ]; then
    echo -e "${RED}Error: No seed data tables found in ${DEMO_DUMP}${NC}"
    echo "Make sure the dump contains tables matching: email_*, languages, learning_*, lesson_*, template_*"
    rm -f "${TOC_FILE}"
    exit 1
fi

# Show which tables will be extracted
echo -e "${GREEN}Tables to extract:${NC}"
grep -o "TABLE DATA public\.[^ ]*" "${TOC_FILE}" | sed 's/TABLE DATA public\./  - /' | sort

if [ "$EXTRACT_TO_SQL" = true ]; then
    # Extract to SQL format (no database needed)
    echo -e "${GREEN}Extracting to SQL format: ${OUTPUT_DIR}/seed.sql${NC}"
    pg_restore \
        --use-list="${TOC_FILE}" \
        --file="${OUTPUT_DIR}/seed.sql" \
        "$DEMO_DUMP" 2>&1 || {
            echo -e "${RED}Error extracting seed data${NC}"
            rm -f "${TOC_FILE}"
            exit 1
        }
    echo -e "${GREEN}✓ Seed data extracted to ${OUTPUT_DIR}/seed.sql${NC}"
else
    # Extract to custom format (requires temporary database)
    echo -e "${GREEN}Extracting to custom format: ${SEED_DUMP}${NC}"
    echo -e "${YELLOW}Note: This requires a temporary database connection${NC}"
    
    # Create a temporary database or use existing one
    TEMP_DB="temp_seed_extract_$$"
    
    # Restore seed data to temporary database
    echo -e "${GREEN}Restoring seed data to temporary database...${NC}"
    psql "${CONNECTION_STRING}" \
        --command "CREATE DATABASE ${TEMP_DB};" 2>&1 || {
            echo -e "${YELLOW}Database may already exist, continuing...${NC}"
        }
    
    TEMP_CONNECTION="host=db.${PROJECT_REF}.supabase.co port=5432 user=postgres dbname=${TEMP_DB} sslmode=require"
    
    # Restore only seed tables to temp database
    pg_restore \
        --dbname="${TEMP_CONNECTION}" \
        --use-list="${TOC_FILE}" \
        --no-owner \
        --no-acl \
        "$DEMO_DUMP" 2>&1 | grep -v "ERROR" || {
            echo -e "${YELLOW}Some warnings during restore (may be expected)${NC}"
        }
    
    # Dump from temp database to seed.dump
    echo -e "${GREEN}Creating seed.dump from temporary database...${NC}"
    pg_dump \
        --host=db.${PROJECT_REF}.supabase.co \
        --port=5432 \
        --user=postgres \
        --dbname=${TEMP_DB} \
        --data-only \
        --format=custom \
        --no-owner \
        --file="${SEED_DUMP}" \
        --verbose
    
    # Clean up temporary database
    echo -e "${GREEN}Cleaning up temporary database...${NC}"
    psql "${CONNECTION_STRING}" \
        --command "DROP DATABASE IF EXISTS ${TEMP_DB};" 2>&1 || true
    
    echo -e "${GREEN}✓ Seed data extracted to ${SEED_DUMP}${NC}"
fi

rm -f "${TOC_FILE}"

echo ""
echo -e "${GREEN}✓ Seed data extraction complete!${NC}"
echo "Files:"
if [ "$EXTRACT_TO_SQL" = true ]; then
    echo "  - ${OUTPUT_DIR}/seed.sql"
else
    echo "  - ${SEED_DUMP}"
fi

