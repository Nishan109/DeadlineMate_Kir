-- Add missing columns to notification_settings table if they don't exist
DO $$ 
BEGIN
    -- Add deadline_reminders column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notification_settings' 
                   AND column_name = 'deadline_reminders') THEN
        ALTER TABLE notification_settings ADD COLUMN deadline_reminders BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add reminder_hours column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notification_settings' 
                   AND column_name = 'reminder_hours') THEN
        ALTER TABLE notification_settings ADD COLUMN reminder_hours INTEGER DEFAULT 24;
    END IF;
    
    -- Rename reminder_timing to reminder_hours if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notification_settings' 
               AND column_name = 'reminder_timing') THEN
        ALTER TABLE notification_settings RENAME COLUMN reminder_timing TO reminder_hours;
    END IF;
END $$;
