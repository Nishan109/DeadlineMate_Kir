-- Create timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Timetable',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  color TEXT DEFAULT 'blue' CHECK (color IN ('red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'gray')),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_schedules table for time slots and recurrence
CREATE TABLE IF NOT EXISTS activity_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE,
  recurrence_pattern TEXT DEFAULT 'weekly' CHECK (recurrence_pattern IN ('weekly', 'daily', 'custom')),
  specific_dates DATE[], -- For custom/one-time schedules
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create activity_exceptions table for handling schedule exceptions
CREATE TABLE IF NOT EXISTS activity_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_schedule_id UUID REFERENCES activity_schedules(id) ON DELETE CASCADE NOT NULL,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('cancelled', 'rescheduled')),
  new_start_time TIME,
  new_end_time TIME,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for timetables
CREATE POLICY "Users can view their own timetables" ON timetables
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own timetables" ON timetables
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own timetables" ON timetables
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own timetables" ON timetables
  FOR DELETE USING (user_id = auth.uid());

-- RLS policies for activities
CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timetables 
      WHERE timetables.id = activities.timetable_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM timetables 
      WHERE timetables.id = activities.timetable_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM timetables 
      WHERE timetables.id = activities.timetable_id 
      AND timetables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own activities" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM timetables 
      WHERE timetables.id = activities.timetable_id 
      AND timetables.user_id = auth.uid()
    )
  );

-- RLS policies for activity_schedules
CREATE POLICY "Users can view their own activity schedules" ON activity_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN timetables t ON a.timetable_id = t.id
      WHERE a.id = activity_schedules.activity_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own activity schedules" ON activity_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN timetables t ON a.timetable_id = t.id
      WHERE a.id = activity_schedules.activity_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own activity schedules" ON activity_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN timetables t ON a.timetable_id = t.id
      WHERE a.id = activity_schedules.activity_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own activity schedules" ON activity_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN timetables t ON a.timetable_id = t.id
      WHERE a.id = activity_schedules.activity_id 
      AND t.user_id = auth.uid()
    )
  );

-- RLS policies for activity_exceptions
CREATE POLICY "Users can view their own activity exceptions" ON activity_exceptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activity_schedules sch
      JOIN activities a ON sch.activity_id = a.id
      JOIN timetables t ON a.timetable_id = t.id
      WHERE sch.id = activity_exceptions.activity_schedule_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own activity exceptions" ON activity_exceptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_schedules sch
      JOIN activities a ON sch.activity_id = a.id
      JOIN timetables t ON a.timetable_id = t.id
      WHERE sch.id = activity_exceptions.activity_schedule_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own activity exceptions" ON activity_exceptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM activity_schedules sch
      JOIN activities a ON sch.activity_id = a.id
      JOIN timetables t ON a.timetable_id = t.id
      WHERE sch.id = activity_exceptions.activity_schedule_id 
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own activity exceptions" ON activity_exceptions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM activity_schedules sch
      JOIN activities a ON sch.activity_id = a.id
      JOIN timetables t ON a.timetable_id = t.id
      WHERE sch.id = activity_exceptions.activity_schedule_id 
      AND t.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timetables_user_id ON timetables(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timetable_id ON activities(timetable_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activity_schedules_activity_id ON activity_schedules(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_schedules_day_time ON activity_schedules(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_activity_exceptions_schedule_id ON activity_exceptions(activity_schedule_id);
CREATE INDEX IF NOT EXISTS idx_activity_exceptions_date ON activity_exceptions(exception_date);

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_timetable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_timetables_updated_at
  BEFORE UPDATE ON timetables
  FOR EACH ROW
  EXECUTE FUNCTION update_timetable_updated_at();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_timetable_updated_at();

CREATE TRIGGER update_activity_schedules_updated_at
  BEFORE UPDATE ON activity_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_timetable_updated_at();

-- Function to get current activity for a user
CREATE OR REPLACE FUNCTION get_current_activity(user_uuid UUID)
RETURNS TABLE (
  activity_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  color TEXT,
  location TEXT,
  start_time TIME,
  end_time TIME,
  day_of_week INTEGER
) AS $$
DECLARE
  current_day INTEGER;
  current_time TIME;
BEGIN
  -- Get current day of week (0 = Sunday, 6 = Saturday)
  current_day := EXTRACT(DOW FROM NOW());
  current_time := NOW()::TIME;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.category,
    a.color,
    a.location,
    sch.start_time,
    sch.end_time,
    sch.day_of_week
  FROM activities a
  JOIN activity_schedules sch ON a.id = sch.activity_id
  JOIN timetables t ON a.timetable_id = t.id
  WHERE t.user_id = user_uuid
    AND t.is_active = TRUE
    AND sch.is_active = TRUE
    AND sch.day_of_week = current_day
    AND current_time BETWEEN sch.start_time AND sch.end_time
    AND NOT EXISTS (
      SELECT 1 FROM activity_exceptions ex
      WHERE ex.activity_schedule_id = sch.id
        AND ex.exception_date = CURRENT_DATE
        AND ex.exception_type = 'cancelled'
    )
  ORDER BY sch.start_time
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get next activity for a user
CREATE OR REPLACE FUNCTION get_next_activity(user_uuid UUID)
RETURNS TABLE (
  activity_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  color TEXT,
  location TEXT,
  start_time TIME,
  end_time TIME,
  day_of_week INTEGER,
  days_until INTEGER
) AS $$
DECLARE
  current_day INTEGER;
  current_time TIME;
BEGIN
  current_day := EXTRACT(DOW FROM NOW());
  current_time := NOW()::TIME;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.category,
    a.color,
    a.location,
    sch.start_time,
    sch.end_time,
    sch.day_of_week,
    CASE 
      WHEN sch.day_of_week = current_day AND sch.start_time > current_time THEN 0
      WHEN sch.day_of_week > current_day THEN sch.day_of_week - current_day
      ELSE 7 - current_day + sch.day_of_week
    END as days_until
  FROM activities a
  JOIN activity_schedules sch ON a.id = sch.activity_id
  JOIN timetables t ON a.timetable_id = t.id
  WHERE t.user_id = user_uuid
    AND t.is_active = TRUE
    AND sch.is_active = TRUE
    AND (
      (sch.day_of_week = current_day AND sch.start_time > current_time) OR
      (sch.day_of_week != current_day)
    )
    AND NOT EXISTS (
      SELECT 1 FROM activity_exceptions ex
      WHERE ex.activity_schedule_id = sch.id
        AND ex.exception_date = CURRENT_DATE + INTERVAL '1 day' * 
          CASE 
            WHEN sch.day_of_week = current_day AND sch.start_time > current_time THEN 0
            WHEN sch.day_of_week > current_day THEN sch.day_of_week - current_day
            ELSE 7 - current_day + sch.day_of_week
          END
        AND ex.exception_type = 'cancelled'
    )
  ORDER BY days_until, sch.start_time
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create default timetable for new users
CREATE OR REPLACE FUNCTION create_default_timetable()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timetables (user_id, name, description)
  VALUES (NEW.id, 'My Schedule', 'Default timetable');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create default timetable on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created_timetable
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_default_timetable();
