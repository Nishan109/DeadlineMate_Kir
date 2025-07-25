-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deadline_today', 'deadline_overdue', 'deadline_upcoming', 'general')),
  is_read BOOLEAN DEFAULT FALSE,
  deadline_id UUID REFERENCES deadlines(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  deadline_reminders BOOLEAN DEFAULT TRUE,
  reminder_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification settings
CREATE POLICY "Users can view their own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" ON notification_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Function to generate deadline notifications
CREATE OR REPLACE FUNCTION generate_deadline_notifications()
RETURNS void AS $$
DECLARE
  deadline_record RECORD;
  notification_exists BOOLEAN;
BEGIN
  -- Generate notifications for deadlines due today
  FOR deadline_record IN 
    SELECT d.*, u.id as user_id
    FROM deadlines d
    JOIN auth.users u ON d.user_id = u.id
    WHERE DATE(d.due_date) = CURRENT_DATE
    AND d.status != 'completed'
  LOOP
    -- Check if notification already exists
    SELECT EXISTS(
      SELECT 1 FROM notifications 
      WHERE user_id = deadline_record.user_id 
      AND deadline_id = deadline_record.id 
      AND type = 'deadline_today'
      AND DATE(created_at) = CURRENT_DATE
    ) INTO notification_exists;
    
    -- Create notification if it doesn't exist
    IF NOT notification_exists THEN
      INSERT INTO notifications (user_id, title, message, type, deadline_id)
      VALUES (
        deadline_record.user_id,
        'Deadline Today',
        'Your deadline "' || deadline_record.title || '" is due today at ' || 
        TO_CHAR(deadline_record.due_date, 'HH12:MI AM'),
        'deadline_today',
        deadline_record.id
      );
    END IF;
  END LOOP;

  -- Generate notifications for overdue deadlines
  FOR deadline_record IN 
    SELECT d.*, u.id as user_id
    FROM deadlines d
    JOIN auth.users u ON d.user_id = u.id
    WHERE d.due_date < NOW()
    AND d.status != 'completed'
  LOOP
    -- Check if notification already exists
    SELECT EXISTS(
      SELECT 1 FROM notifications 
      WHERE user_id = deadline_record.user_id 
      AND deadline_id = deadline_record.id 
      AND type = 'deadline_overdue'
      AND DATE(created_at) = CURRENT_DATE
    ) INTO notification_exists;
    
    -- Create notification if it doesn't exist
    IF NOT notification_exists THEN
      INSERT INTO notifications (user_id, title, message, type, deadline_id)
      VALUES (
        deadline_record.user_id,
        'Overdue Deadline',
        'Your deadline "' || deadline_record.title || '" was due on ' || 
        TO_CHAR(deadline_record.due_date, 'Mon DD, YYYY'),
        'deadline_overdue',
        deadline_record.id
      );
    END IF;
  END LOOP;

  -- Generate notifications for upcoming high-priority deadlines (within 3 days)
  FOR deadline_record IN 
    SELECT d.*, u.id as user_id
    FROM deadlines d
    JOIN auth.users u ON d.user_id = u.id
    WHERE d.due_date BETWEEN NOW() + INTERVAL '1 day' AND NOW() + INTERVAL '3 days'
    AND d.priority = 'high'
    AND d.status != 'completed'
  LOOP
    -- Check if notification already exists
    SELECT EXISTS(
      SELECT 1 FROM notifications 
      WHERE user_id = deadline_record.user_id 
      AND deadline_id = deadline_record.id 
      AND type = 'deadline_upcoming'
      AND DATE(created_at) = CURRENT_DATE
    ) INTO notification_exists;
    
    -- Create notification if it doesn't exist
    IF NOT notification_exists THEN
      INSERT INTO notifications (user_id, title, message, type, deadline_id)
      VALUES (
        deadline_record.user_id,
        'Urgent Deadline Approaching',
        'High priority deadline "' || deadline_record.title || '" is due on ' || 
        TO_CHAR(deadline_record.due_date, 'Mon DD, YYYY'),
        'deadline_upcoming',
        deadline_record.id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
