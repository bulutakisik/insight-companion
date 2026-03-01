
-- Add conversation columns to sprint_tasks
ALTER TABLE sprint_tasks 
ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'execution',
ADD COLUMN IF NOT EXISTS conversation_scope text,
ADD COLUMN IF NOT EXISTS conversation_state jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS conversation_messages jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS requires_user_input boolean DEFAULT false;
