
create table public.sprint_tasks (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.growth_sessions(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  sprint_number integer not null default 1,
  agent text not null,
  task_title text not null,
  task_description text,
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'completed', 'failed')),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  deliverables jsonb default '[]',
  agent_brief jsonb,
  output_text text,
  error_message text
);

alter table public.sprint_tasks enable row level security;

create policy "Anyone can read sprint tasks" on public.sprint_tasks for select using (true);
create policy "Anyone can insert sprint tasks" on public.sprint_tasks for insert with check (true);
create policy "Anyone can update sprint tasks" on public.sprint_tasks for update using (true);

create index idx_sprint_tasks_session on public.sprint_tasks(session_id);
create index idx_sprint_tasks_status on public.sprint_tasks(status);

create trigger update_sprint_tasks_updated_at
  before update on public.sprint_tasks
  for each row
  execute function public.update_updated_at_column();
