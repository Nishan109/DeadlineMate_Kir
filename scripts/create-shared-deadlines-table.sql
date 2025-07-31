-- Create shared_deadlines table for sharing deadline links
CREATE TABLE IF NOT EXISTS shared_deadlines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_deadlines_token ON shared_deadlines(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_deadlines_deadline_id ON shared_deadlines(deadline_id);
CREATE INDEX IF NOT EXISTS idx_shared_deadlines_created_by ON shared_deadlines(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_deadlines_expires_at ON shared_deadlines(expires_at);

-- Enable RLS
ALTER TABLE shared_deadlines ENABLE ROW LEVEL SECURITY;

-- Policy for users to create shares for their own deadlines
CREATE POLICY "Users can create shares for their own deadlines" ON shared_deadlines
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM deadlines 
            WHERE deadlines.id = deadline_id 
            AND deadlines.user_id = auth.uid()
        )
    );

-- Policy for users to view their own shares
CREATE POLICY "Users can view their own shares" ON shared_deadlines
    FOR SELECT USING (created_by = auth.uid());

-- Policy for users to update their own shares
CREATE POLICY "Users can update their own shares" ON shared_deadlines
    FOR UPDATE USING (created_by = auth.uid());

-- Policy for users to delete their own shares
CREATE POLICY "Users can delete their own shares" ON shared_deadlines
    FOR DELETE USING (created_by = auth.uid());

-- Policy for anonymous users to view active, non-expired shares (for public access)
CREATE POLICY "Anonymous users can view active shares" ON shared_deadlines
    FOR SELECT USING (
        is_active = true AND
        (expires_at IS NULL OR expires_at > NOW())
    );

-- Grant permissions
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

-- Create a scheduled job to clean up expired shares (if pg_cron is available)
-- This will run daily at midnight
-- SELECT cron.schedule('cleanup-expired-shares', '0 0 * * *', 'SELECT cleanup_expired_shares();');
