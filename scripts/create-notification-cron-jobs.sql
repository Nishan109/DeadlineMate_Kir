-- This file sets up automatic notification generation using pg_cron
-- Note: pg_cron extension needs to be enabled by your database administrator

-- Enable the pg_cron extension (requires superuser privileges)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule notification generation to run every hour
-- This will check for new deadlines and create appropriate notifications
SELECT cron.schedule(
    'generate-deadline-notifications',
    '0 * * * *', -- Run every hour at minute 0
    'SELECT generate_deadline_notifications();'
);

-- Schedule cleanup of old notifications (older than 30 days) to run daily at 2 AM
SELECT cron.schedule(
    'cleanup-old-notifications',
    '0 2 * * *', -- Run daily at 2 AM
    'DELETE FROM notifications WHERE created_at < NOW() - INTERVAL ''30 days'';'
);

-- Alternative: Manual trigger setup
-- You can call this function manually or set up your own scheduling system
-- Example: Call this from your application or use a service like Vercel Cron Jobs

-- To manually generate notifications, run:
-- SELECT generate_deadline_notifications();

-- For production, consider using:
-- 1. Vercel Cron Jobs (api/cron/notifications)
-- 2. GitHub Actions with scheduled workflows
-- 3. External cron services
-- 4. Database triggers on deadline creation/updates

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove a scheduled job:
-- SELECT cron.unschedule('generate-deadline-notifications');
-- SELECT cron.unschedule('cleanup-old-notifications');

COMMENT ON FUNCTION generate_deadline_notifications() IS 
'Generates notifications for deadlines that are due today, overdue, or upcoming high-priority items. Should be called regularly (hourly recommended).';
