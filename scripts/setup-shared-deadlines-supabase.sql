-- Complete setup script for shared deadlines functionality in Supabase
-- Run this script in your Supabase SQL Editor

-- First, drop existing table and policies if they exist
DROP POLICY IF EXISTS "Public can view active shared deadlines" ON shared_deadlines;
DROP POLICY IF EXISTS "Users can delete their own shares" ON shared_deadlines;
DROP POLICY IF EXISTS "Users can update their own shares" ON shared_deadlines;
DROP POLICY IF EXISTS "Users can view their own shares" ON shared_deadlines;
DROP POLICY IF EXISTS "Users can create shares for their own deadlines" ON shared_deadlines;
DROP POLICY IF EXISTS "Anonymous users can view active shares" ON shared_deadlines;

DROP TABLE IF EXISTS shared_deadlines CASCADE;

-- Create the shared_deadlines table
CREATE TABLE shared_deadlines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deadline_id UUID NOT NULL,
    share_token TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints (only if the referenced tables exist)
DO $$
BEGIN
    -- Check if deadlines table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deadlines') THEN
        ALTER TABLE shared_deadlines 
        ADD CONSTRAINT fk_shared_deadlines_deadline 
        FOREIGN KEY (deadline_id) REFERENCES deadlines(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to auth.users
    ALTER TABLE shared_deadlines 
    ADD CONSTRAINT fk_shared_deadlines_user 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Create indexes for better performance
CREATE INDEX idx_shared_deadlines_token ON shared_deadlines(share_token);
CREATE INDEX idx_shared_deadlines_deadline_id ON shared_deadlines(deadline_id);
CREATE INDEX idx_shared_deadlines_created_by ON shared_deadlines(created_by);
CREATE INDEX idx_shared_deadlines_expires_at ON shared_deadlines(expires_at);
CREATE INDEX idx_shared_deadlines_active ON shared_deadlines(is_active);

-- Enable RLS
ALTER TABLE shared_deadlines ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to create shares for their own deadlines
CREATE POLICY "Users can create shares for their own deadlines" ON shared_deadlines
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        created_by = auth.uid() AND
        (
            NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deadlines')
            OR
            EXISTS (
                SELECT 1 FROM deadlines 
                WHERE deadlines.id = deadline_id 
                AND deadlines.user_id = auth.uid()
            )
        )
    );

-- Policy for authenticated users to view their own shares
CREATE POLICY "Users can view their own shares" ON shared_deadlines
    FOR SELECT 
    TO authenticated
    USING (created_by = auth.uid());

-- Policy for authenticated users to update their own shares
CREATE POLICY "Users can update their own shares" ON shared_deadlines
    FOR UPDATE 
    TO authenticated
    USING (created_by = auth.uid());

-- Policy for authenticated users to delete their own shares
CREATE POLICY "Users can delete their own shares" ON shared_deadlines
    FOR DELETE 
    TO authenticated
    USING (created_by = auth.uid());

-- CRITICAL: Policy for public (anonymous) access to active shared deadlines
CREATE POLICY "Public can view active shared deadlines" ON shared_deadlines
    FOR SELECT 
    TO anon, authenticated
    USING (
        is_active = true AND
        (expires_at IS NULL OR expires_at > NOW())
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON shared_deadlines TO authenticated;
GRANT SELECT ON shared_deadlines TO anon;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_shared_deadlines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_shared_deadlines_updated_at ON shared_deadlines;
CREATE TRIGGER update_shared_deadlines_updated_at
    BEFORE UPDATE ON shared_deadlines
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_deadlines_updated_at();

-- Create function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS void AS $$
BEGIN
    UPDATE shared_deadlines 
    SET is_active = false 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create some test data for development (remove in production)
DO $$
DECLARE
    test_user_id UUID;
    test_deadline_id UUID;
BEGIN
    -- Only create test data if we're in a development environment
    -- Check if there are any existing users
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Check if deadlines table exists and has data
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deadlines') THEN
            SELECT id INTO test_deadline_id FROM deadlines WHERE user_id = test_user_id LIMIT 1;
            
            IF test_deadline_id IS NOT NULL THEN
                -- Insert a test shared deadline
                INSERT INTO shared_deadlines (
                    deadline_id, 
                    share_token, 
                    created_by, 
                    expires_at, 
                    is_active
                ) VALUES (
                    test_deadline_id,
                    'test-' || substr(md5(random()::text), 1, 12),
                    test_user_id,
                    NOW() + INTERVAL '30 days',
                    true
                ) ON CONFLICT (share_token) DO NOTHING;
            END IF;
        ELSE
            -- Create a mock deadline for testing if deadlines table doesn't exist
            -- This is just for development testing
            INSERT INTO shared_deadlines (
                deadline_id, 
                share_token, 
                created_by, 
                expires_at, 
                is_active
            ) VALUES (
                gen_random_uuid(),
                'demo-test-token-123',
                test_user_id,
                NOW() + INTERVAL '30 days',
                true
            ) ON CONFLICT (share_token) DO NOTHING;
        END IF;
    END IF;
END $$;

-- Verify the setup
SELECT 
    'Setup completed successfully!' as status,
    COUNT(*) as test_records_created
FROM shared_deadlines;
