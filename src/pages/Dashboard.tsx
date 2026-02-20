import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (!sessionId) {
      navigate("/");
      return;
    }

    supabase
      .from("growth_sessions")
      .select("paid")
      .eq("id", sessionId)
      .single()
      .then(({ data }) => {
        if (!(data as any)?.paid) {
          navigate(`/?session=${sessionId}`);
        } else {
          setLoading(false);
        }
      });
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground-3 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="text-5xl">🚀</div>
        <h1 className="font-serif text-3xl font-normal text-foreground">
          Sprint 1 is underway
        </h1>
        <p className="text-foreground-3 text-base leading-relaxed">
          Your growth team is working. Weekly report drops Friday.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Agents active
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
