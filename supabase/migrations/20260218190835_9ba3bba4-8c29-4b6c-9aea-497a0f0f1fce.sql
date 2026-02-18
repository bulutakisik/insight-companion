
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_phase INTEGER NOT NULL DEFAULT 0,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public access for now (no auth required for MVP)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create sessions"
ON public.sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read their session by ID"
ON public.sessions FOR SELECT
USING (true);

CREATE POLICY "Anyone can update sessions"
ON public.sessions FOR UPDATE
USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
