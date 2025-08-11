-- Create timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  location VARCHAR(255),
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_schedules table
CREATE TABLE IF NOT EXISTS activity_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule_exceptions table
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES activity_schedules(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  exception_type VARCHAR(20) CHECK (exception_type IN ('skip', 'reschedule')),
  new_start_time TIME,
  new_end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own timetables" ON timetables
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timetables" ON timetables
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timetables" ON timetables
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timetables" ON timetables
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view activities in their timetables" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timetables 
      WHERE timetables.id = activities.timetable_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities in their timetables" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM timetables 
      WHERE timetables.id = activities.timetable_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities in their timetables" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM timetables 
      WHERE timetables.id = activities.timetable_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities in their timetables" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM timetables 
      WHERE timetables.id = activities.timetable_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view schedules for their activities" ON activity_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities 
      JOIN timetables ON timetables.id = activities.timetable_id
      WHERE activities.id = activity_schedules.activity_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert schedules for their activities" ON activity_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities 
      JOIN timetables ON timetables.id = activities.timetable_id
      WHERE activities.id = activity_schedules.activity_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules for their activities" ON activity_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM activities 
      JOIN timetables ON timetables.id = activities.timetable_id
      WHERE activities.id = activity_schedules.activity_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schedules for their activities" ON activity_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM activities 
      JOIN timetables ON timetables.id = activities.timetable_id
      WHERE activities.id = activity_schedules.activity_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view exceptions for their schedules" ON schedule_exceptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activity_schedules 
      JOIN activities ON activities.id = activity_schedules.activity_id
      JOIN timetables ON timetables.id = activities.timetable_id
      WHERE activity_schedules.id = schedule_exceptions.schedule_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exceptions for their schedules" ON schedule_exceptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_schedules 
      JOIN activities ON activities.id = activity_schedules.activity_id
      JOIN timetables ON timetables.id = activities.timetable_id
      WHERE activity_schedules.id = schedule_exceptions.schedule_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exceptions for their schedules" ON schedule_exceptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM activity_schedules 
      JOIN activities ON activities.id = activity_schedules.activity_id
      JOIN timetables ON timetables.id = activities.timetable_id
      WHERE activity_schedules.id = schedule_exceptions.schedule_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exceptions for their schedules" ON schedule_exceptions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM activity_schedules 
      JOIN activities ON activities.id = activity_schedules.activity_id
      JOIN timetables ON timetables.id = activities.timetable_id
      WHERE activity_schedules.id = schedule_exceptions.schedule_id 
      AND timetables.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timetables_user_id ON timetables(user_id);
CREATE INDEX IF NOT EXISTS idx_timetables_is_active ON timetables(is_active);
CREATE INDEX IF NOT EXISTS idx_activities_timetable_id ON activities(timetable_id);
CREATE INDEX IF NOT EXISTS idx_activity_schedules_activity_id ON activity_schedules(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_schedules_day_of_week ON activity_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_schedule_id ON schedule_exceptions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON schedule_exceptions(exception_date);

-- Create function to get current activity
CREATE OR REPLACE FUNCTION get_current_activity(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  category VARCHAR,
  location VARCHAR,
  color VARCHAR,
  start_time TIME,
  end_time TIME,
  day_of_week INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.category,
    a.location,
    a.color,
    s.start_time,
    s.end_time,
    s.day_of_week
  FROM activities a
  JOIN activity_schedules s ON a.id = s.activity_id
  JOIN timetables t ON a.timetable_id = t.id
  WHERE t.user_id = user_uuid
    AND t.is_active = true
    AND s.is_active = true
    AND s.day_of_week = EXTRACT(DOW FROM NOW())
    AND CURRENT_TIME BETWEEN s.start_time AND s.end_time
    AND NOT EXISTS (
      SELECT 1 FROM schedule_exceptions e
      WHERE e.schedule_id = s.id
        AND e.exception_date = CURRENT_DATE
        AND e.exception_type = 'skip'
    )
  ORDER BY s.start_time
  LIMIT 1;
END;
$$;

-- Create function to get next activity
CREATE OR REPLACE FUNCTION get_next_activity(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  category VARCHAR,
  location VARCHAR,
  color VARCHAR,
  start_time TIME,
  end_time TIME,
  day_of_week INTEGER,
  time_until_start INTERVAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.category,
    a.location,
    a.color,
    s.start_time,
    s.end_time,
    s.day_of_week,
    (s.start_time - CURRENT_TIME) as time_until_start
  FROM activities a
  JOIN activity_schedules s ON a.id = s.activity_id
  JOIN timetables t ON a.timetable_id = t.id
  WHERE t.user_id = user_uuid
    AND t.is_active = true
    AND s.is_active = true
    AND (
      (s.day_of_week = EXTRACT(DOW FROM NOW()) AND s.start_time > CURRENT_TIME)
      OR s.day_of_week > EXTRACT(DOW FROM NOW())
      OR (s.day_of_week < EXTRACT(DOW FROM NOW()) AND EXTRACT(DOW FROM NOW()) = 6)
    )
    AND NOT EXISTS (
      SELECT 1 FROM schedule_exceptions e
      WHERE e.schedule_id = s.id
        AND e.exception_date = CURRENT_DATE
        AND e.exception_type = 'skip'
    )
  ORDER BY 
    CASE 
      WHEN s.day_of_week = EXTRACT(DOW FROM NOW()) THEN s.start_time
      ELSE s.start_time + INTERVAL '1 day' * (7 - EXTRACT(DOW FROM NOW()) + s.day_of_week)
    END
  LIMIT 1;
END;
$$;
