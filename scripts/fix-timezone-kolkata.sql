-- Fix timezone for Asia/Kolkata in DeadlineMate
-- Run this in your Supabase SQL Editor

-- First, let's check the current timezone settings
SELECT 
    name,
    setting 
FROM pg_settings 
WHERE name IN ('timezone', 'log_timezone');

-- Check current deadlines and their timezone
SELECT 
    id,
    title,
    due_date,
    due_date AT TIME ZONE 'UTC' AS due_date_utc,
    due_date AT TIME ZONE 'Asia/Kolkata' AS due_date_kolkata,
    created_at
FROM deadlines 
ORDER BY created_at DESC 
LIMIT 10;

-- If your deadlines are stored in UTC and you want to convert them to Asia/Kolkata
-- (This assumes your deadlines were created in UTC but should be in Asia/Kolkata)
-- UNCOMMENT THE FOLLOWING LINES IF YOU NEED TO CONVERT EXISTING DATA:

-- UPDATE deadlines 
-- SET due_date = due_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
-- WHERE due_date IS NOT NULL;

-- Alternative: If you want to keep UTC storage but ensure proper display
-- You can also set the database timezone to Asia/Kolkata
-- ALTER DATABASE your_database_name SET timezone TO 'Asia/Kolkata';

-- Check shared deadlines as well
SELECT 
    sd.id,
    sd.share_token,
    d.title,
    d.due_date,
    d.due_date AT TIME ZONE 'UTC' AS due_date_utc,
    d.due_date AT TIME ZONE 'Asia/Kolkata' AS due_date_kolkata
FROM shared_deadlines sd
JOIN deadlines d ON sd.deadline_id = d.id
ORDER BY sd.created_at DESC 
LIMIT 5;
