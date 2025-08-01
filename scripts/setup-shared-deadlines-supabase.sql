-- DeadlineMate Shared Deadlines Setup Script for Supabase
-- Run this script in your Supabase SQL Editor

-- First, let's check if the deadlines table exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deadlines') THEN
        CREATE TABLE deadlines (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            due_date TIMESTAMPTZ NOT NULL,
            priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
            status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
            category TEXT,
            project_link TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create RLS policies for deadlines
        ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own deadlines" ON deadlines
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own deadlines" ON deadlines
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own deadlines" ON deadlines
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own deadlines" ON deadlines
            FOR DELETE USING (auth.uid() = user_id);

        -- Create indexes for better performance
        CREATE INDEX idx_deadlines_user_id ON deadlines(user_id);
        CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);
        CREATE INDEX idx_deadlines_status ON deadlines(status);

        RAISE NOTICE 'Deadlines table created successfully';
    ELSE
        RAISE NOTICE 'Deadlines table already exists';
    END IF;
END
$$;

-- Now create the shared_deadlines table
DROP TABLE IF EXISTS shared_deadlines CASCADE;

CREATE TABLE shared_deadlines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deadline_id UUID REFERENCES deadlines(id) ON DELETE CASCADE NOT NULL,
    share_token TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_shared_deadlines_token ON shared_deadlines(share_token);
CREATE INDEX idx_shared_deadlines_deadline_id ON shared_deadlines(deadline_id);
CREATE INDEX idx_shared_deadlines_created_by ON shared_deadlines(created_by);
CREATE INDEX idx_shared_deadlines_expires_at ON shared_deadlines(expires_at);

-- Enable RLS
ALTER TABLE shared_deadlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_deadlines

-- Policy 1: Allow authenticated users to create shares for their own deadlines
CREATE POLICY "Users can create shares for their own deadlines" ON shared_deadlines
    FOR INSERT 
    WITH CHECK (
        auth.uid() = created_by 
        AND EXISTS (
            SELECT 1 FROM deadlines 
            WHERE deadlines.id = deadline_id 
            AND deadlines.user_id = auth.uid()
        )
    );

-- Policy 2: Allow users to view and manage their own shares
CREATE POLICY "Users can manage their own shares" ON shared_deadlines
    FOR ALL 
    USING (auth.uid() = created_by);

-- Policy 3: CRITICAL - Allow anonymous (public) access to active, non-expired shared deadlines
CREATE POLICY "Public can view active shared deadlines" ON shared_deadlines
    FOR SELECT 
    USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Policy 4: Allow public access to deadlines that are shared
CREATE POLICY "Public can view shared deadline details" ON deadlines
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM shared_deadlines 
            WHERE shared_deadlines.deadline_id = deadlines.id 
            AND shared_deadlines.is_active = true 
            AND (shared_deadlines.expires_at IS NULL OR shared_deadlines.expires_at > NOW())
        )
    );

-- Create a function to automatically disable expired shares
CREATE OR REPLACE FUNCTION disable_expired_shares()
RETURNS void AS $$
BEGIN
    UPDATE shared_deadlines 
    SET is_active = false, updated_at = NOW()
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old expired shares (optional)
CREATE OR REPLACE FUNCTION cleanup_old_shares()
RETURNS void AS $$
BEGIN
    DELETE FROM shared_deadlines 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Insert some test data for development (only if deadlines table is empty)
DO $$
DECLARE
    test_user_id UUID;
    test_deadline_id UUID;
    test_share_token TEXT;
BEGIN
    -- Check if we have any users
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Check if deadlines table is empty
        IF NOT EXISTS (SELECT 1 FROM deadlines LIMIT 1) THEN
            -- Insert a test deadline
            INSERT INTO deadlines (
                id, user_id, title, description, due_date, priority, status, category, project_link
            ) VALUES (
                gen_random_uuid(),
                test_user_id,
                'Sample Project Deadline',
                'This is a sample deadline created for testing the sharing functionality. It includes all the necessary fields and demonstrates how shared deadlines work.',
                NOW() + INTERVAL '7 days',
                'high',
                'in_progress',
                'Development',
                'https://github.com/example/project'
            ) RETURNING id INTO test_deadline_id;

            -- Create a test share
            test_share_token := 'test-' || substr(gen_random_uuid()::text, 1, 12);
            
            INSERT INTO shared_deadlines (
                deadline_id, share_token, created_by, expires_at, is_active
            ) VALUES (
                test_deadline_id,
                test_share_token,
                test_user_id,
                NOW() + INTERVAL '30 days',
                true
            );

            RAISE NOTICE 'Test data created successfully';
            RAISE NOTICE 'Test share token: %', test_share_token;
            RAISE NOTICE 'Test URL: /shared/%', test_share_token;
        END IF;
    ELSE
        RAISE NOTICE 'No users found - test data not created';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON shared_deadlines TO anon, authenticated;
GRANT SELECT ON deadlines TO anon, authenticated;
GRANT ALL ON shared_deadlines TO authenticated;

RAISE NOTICE 'Shared deadlines setup completed successfully!';
RAISE NOTICE 'You can now create and share deadlines.';
RAISE NOTICE 'Remember to test the functionality after setup.';
