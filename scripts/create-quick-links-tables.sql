-- Quick Links Database Schema
-- This script creates tables for managing user quick links with sharing functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create quick_links table
CREATE TABLE IF NOT EXISTS quick_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    color VARCHAR(20) DEFAULT 'blue',
    is_public BOOLEAN DEFAULT false,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quick_link_shares table for sharing functionality
CREATE TABLE IF NOT EXISTS quick_link_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quick_link_id UUID NOT NULL REFERENCES quick_links(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for public shares
    share_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quick_link_clicks table for analytics
CREATE TABLE IF NOT EXISTS quick_link_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quick_link_id UUID NOT NULL REFERENCES quick_links(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quick_links_user_id ON quick_links(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_links_category ON quick_links(category);
CREATE INDEX IF NOT EXISTS idx_quick_links_is_public ON quick_links(is_public);
CREATE INDEX IF NOT EXISTS idx_quick_links_created_at ON quick_links(created_at);

CREATE INDEX IF NOT EXISTS idx_quick_link_shares_token ON quick_link_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_quick_link_shares_quick_link_id ON quick_link_shares(quick_link_id);
CREATE INDEX IF NOT EXISTS idx_quick_link_shares_shared_by ON quick_link_shares(shared_by);

CREATE INDEX IF NOT EXISTS idx_quick_link_clicks_quick_link_id ON quick_link_clicks(quick_link_id);
CREATE INDEX IF NOT EXISTS idx_quick_link_clicks_clicked_at ON quick_link_clicks(clicked_at);

-- Enable Row Level Security (RLS)
ALTER TABLE quick_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_link_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_link_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_links
CREATE POLICY "Users can view their own quick links" ON quick_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public quick links" ON quick_links
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own quick links" ON quick_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick links" ON quick_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick links" ON quick_links
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quick_link_shares
CREATE POLICY "Users can view shares they created" ON quick_link_shares
    FOR SELECT USING (auth.uid() = shared_by);

CREATE POLICY "Users can view shares made to them" ON quick_link_shares
    FOR SELECT USING (auth.uid() = shared_with);

CREATE POLICY "Users can view public shares" ON quick_link_shares
    FOR SELECT USING (shared_with IS NULL);

CREATE POLICY "Users can create shares for their links" ON quick_link_shares
    FOR INSERT WITH CHECK (
        auth.uid() = shared_by AND
        EXISTS (SELECT 1 FROM quick_links WHERE id = quick_link_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own shares" ON quick_link_shares
    FOR DELETE USING (auth.uid() = shared_by);

-- RLS Policies for quick_link_clicks
CREATE POLICY "Anyone can insert click records" ON quick_link_clicks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view clicks on their links" ON quick_link_clicks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM quick_links WHERE id = quick_link_id AND user_id = auth.uid())
    );

-- Function to update click count
CREATE OR REPLACE FUNCTION increment_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quick_links 
    SET click_count = click_count + 1 
    WHERE id = NEW.quick_link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically increment click count
CREATE TRIGGER trigger_increment_click_count
    AFTER INSERT ON quick_link_clicks
    FOR EACH ROW
    EXECUTE FUNCTION increment_click_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_quick_links_updated_at
    BEFORE UPDATE ON quick_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to get user's quick links with analytics
CREATE OR REPLACE FUNCTION get_user_quick_links(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    url TEXT,
    description TEXT,
    category VARCHAR(100),
    color VARCHAR(20),
    is_public BOOLEAN,
    click_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    recent_clicks INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ql.id,
        ql.title,
        ql.url,
        ql.description,
        ql.category,
        ql.color,
        ql.is_public,
        ql.click_count,
        ql.created_at,
        ql.updated_at,
        COALESCE(recent.click_count, 0)::INTEGER as recent_clicks
    FROM quick_links ql
    LEFT JOIN (
        SELECT 
            quick_link_id,
            COUNT(*) as click_count
        FROM quick_link_clicks 
        WHERE clicked_at >= NOW() - INTERVAL '7 days'
        GROUP BY quick_link_id
    ) recent ON ql.id = recent.quick_link_id
    WHERE ql.user_id = user_uuid
    ORDER BY ql.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get public quick links
CREATE OR REPLACE FUNCTION get_public_quick_links()
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    url TEXT,
    description TEXT,
    category VARCHAR(100),
    color VARCHAR(20),
    click_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ql.id,
        ql.title,
        ql.url,
        ql.description,
        ql.category,
        ql.color,
        ql.click_count,
        ql.created_at
    FROM quick_links ql
    WHERE ql.is_public = true
    ORDER BY ql.click_count DESC, ql.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
