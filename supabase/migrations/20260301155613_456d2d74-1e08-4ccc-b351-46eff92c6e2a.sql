ALTER TABLE sprint_tasks 
DROP CONSTRAINT IF EXISTS sprint_tasks_status_check;

ALTER TABLE sprint_tasks 
ADD CONSTRAINT sprint_tasks_status_check 
CHECK (status IN ('queued', 'in_progress', 'waiting_for_input', 'completed', 'failed'));