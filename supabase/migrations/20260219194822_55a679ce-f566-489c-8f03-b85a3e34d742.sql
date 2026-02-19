
CREATE TABLE public.growth_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company_url text,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  chat_items jsonb DEFAULT '[]'::jsonb,
  output_cards jsonb DEFAULT '[]'::jsonb,
  current_phase integer DEFAULT 0,
  progress_steps jsonb DEFAULT '[]'::jsonb,
  whats_next jsonb
);

ALTER TABLE public.growth_sessions ENABLE ROW LEVEL SECURITY;

-- Public access by URL (no auth yet)
CREATE POLICY "Anyone can create growth sessions"
  ON public.growth_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read growth sessions"
  ON public.growth_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update growth sessions"
  ON public.growth_sessions FOR UPDATE
  USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_growth_sessions_updated_at
  BEFORE UPDATE ON public.growth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
