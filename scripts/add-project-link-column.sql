-- Add project_link column to deadlines table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deadlines' 
        AND column_name = 'project_link'
    ) THEN
        ALTER TABLE deadlines ADD COLUMN project_link TEXT;
        
        -- Add comment for documentation
        COMMENT ON COLUMN deadlines.project_link IS 'Optional URL link to project resources (GitHub, Figma, etc.)';
        
        -- Create index for better performance when filtering by project links
        CREATE INDEX IF NOT EXISTS idx_deadlines_project_link ON deadlines(project_link) WHERE project_link IS NOT NULL;
        
        RAISE NOTICE 'Added project_link column to deadlines table';
    ELSE
        RAISE NOTICE 'project_link column already exists in deadlines table';
    END IF;
END $$;

-- Update RLS policies to include project_link column
DROP POLICY IF EXISTS "Users can view own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can insert own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can update own deadlines" ON deadlines;
DROP POLICY IF EXISTS "Users can delete own deadlines" ON deadlines;

-- Recreate RLS policies with project_link support
CREATE POLICY "Users can view own deadlines" ON deadlines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deadlines" ON deadlines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deadlines" ON deadlines
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deadlines" ON deadlines
    FOR DELETE USING (auth.uid() = user_id);
