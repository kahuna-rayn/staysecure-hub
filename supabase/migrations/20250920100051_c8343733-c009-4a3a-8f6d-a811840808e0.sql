-- Step 1: Update existing records where is_module = true to set lesson_type = 'module'
UPDATE lessons 
SET lesson_type = 'module' 
WHERE is_module = true AND lesson_type IS NULL;

-- Step 2: Set default lesson_type = 'lesson' for records where it's null and is_module is false/null
UPDATE lessons 
SET lesson_type = 'lesson' 
WHERE lesson_type IS NULL;

-- Step 3: Drop the is_module column
ALTER TABLE lessons DROP COLUMN is_module;