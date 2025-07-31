-- Create shared_deadlines table for sharing functionality
CREATE TABLE IF NOT EXISTS shared_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deadline_id UUID REFERENCES deadlines ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE shared_deadlines ENABLE ROW LEVEL SECURITY;

-- Create policies for shared_deadlines
CREATE POLICY "Users can view own shared deadlines" ON shared_deadlines FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert own shared deadlines" ON shared_deadlines FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own shared deadlines" ON shared_deadlines FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own shared deadlines" ON shared_deadlines FOR DELETE USING (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS shared_deadlines_deadline_id_idx ON shared_deadlines(deadline_id);
CREATE INDEX IF NOT EXISTS shared_deadlines_share_token_idx ON shared_deadlines(share_token);
CREATE INDEX IF NOT EXISTS shared_deadlines_created_by_idx ON shared_deadlines(created_by);
CREATE INDEX IF NOT EXISTS shared_deadlines_expires_at_idx ON shared_deadlines(expires_at);

-- Create function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS void AS $$
BEGIN
  DELETE FROM shared_deadlines 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
