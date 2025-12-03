-- Add English language to languages table
INSERT INTO languages (code, name, display_name, native_name, is_active, flag_emoji, sort_order)
VALUES ('en', 'English', 'English', 'English', true, '🇺🇸', 0);

-- Update existing language display names to match profile data
UPDATE languages SET display_name = 'Chinese' WHERE code = 'zh';
UPDATE languages SET display_name = 'Burmese' WHERE code = 'my';
UPDATE languages SET display_name = 'Indonesian' WHERE code = 'id';

-- Make display_name unique (required for foreign key)
ALTER TABLE languages ADD CONSTRAINT languages_display_name_unique UNIQUE (display_name);

-- Add foreign key constraint from profiles.language to languages.display_name
ALTER TABLE profiles ADD CONSTRAINT profiles_language_fkey 
FOREIGN KEY (language) REFERENCES languages(display_name);