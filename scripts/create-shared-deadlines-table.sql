-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS shared_deadlines CASCADE;

-- Create shared_deadlines table for deadline sharing functionality
CREATE TABLE shared_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deadline_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID DEFAULT auth.uid()
);

-- Add foreign key constraint
ALTER TABLE shared_deadlines 
ADD CONSTRAINT fk_shared_deadlines_deadline 
FOREIGN KEY (deadline_id) REFERENCES deadlines(id) ON DELETE CASCADE;

ALTER TABLE shared_deadlines 
ADD CONSTRAINT fk_shared_deadlines_user 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_deadlines_token ON shared_deadlines(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_deadlines_deadline_id ON shared_deadlines(deadline_id);
CREATE INDEX IF NOT EXISTS idx_shared_deadlines_expires_at ON shared_deadlines(expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_deadlines_created_by ON shared_deadlines(created_by);

-- Enable RLS
ALTER TABLE shared_deadlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Fixed to work with the correct user_id column
CREATE POLICY "Users can create shares for their own deadlines" ON shared_deadlines
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM deadlines 
      WHERE deadlines.id = deadline_id 
      AND deadlines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own shares" ON shared_deadlines
  FOR SELECT USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their own shares" ON shared_deadlines
  FOR UPDATE USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own shares" ON shared_deadlines
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- Public policy for viewing shared deadlines (for the shared page)
CREATE POLICY "Anyone can view active, non-expired shares" ON shared_deadlines
  FOR SELECT USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Function to cleanup expired shares
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

-- Grant necessary permissions
GRANT ALL ON shared_deadlines TO authenticated;
GRANT ALL ON shared_deadlines TO anon;
