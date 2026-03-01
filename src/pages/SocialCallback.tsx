import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SocialCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [displayName, setDisplayName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  const taskId = searchParams.get("task_id") || "";
  const platform = searchParams.get("platform") || "";
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  useEffect(() => {
    if (!taskId || !platform) {
      setStatus("error");
      setErrorMessage("Missing task or platform information.");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-social-connection", {
          body: { task_id: taskId, platform },
        });
        if (error || !data?.success) {
          setStatus("error");
          setErrorMessage(data?.error || error?.message || "Verification failed.");
          return;
        }
        setDisplayName(data.account?.displayName || "");
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Unexpected error.");
      }
    };

    verify();
  }, [taskId, platform]);

  // Countdown + redirect on success
  useEffect(() => {
    if (status !== "success") return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          // Get session_id from the task to redirect properly
          window.location.href = "/dashboard";
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const handleRetry = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center font-dm-sans"
      style={{ background: "hsl(var(--dash-bg, 220 20% 97%))" }}
    >
      <div className="max-w-[480px] w-full mx-4 text-center">
        {/* Logo */}
        <div className="text-2xl font-bold mb-8" style={{ color: "hsl(var(--foreground))" }}>
          Launch<span style={{ color: "hsl(var(--dash-accent, 220 80% 56%))" }}>Agent</span>
        </div>

        {status === "verifying" && (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h1 className="text-xl font-bold mb-2">Verifying Connection...</h1>
            <p className="text-sm" style={{ color: "hsl(var(--dash-text-secondary, 220 10% 50%))" }}>
              Confirming your {platformName} authorization.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold mb-2">{platformName} Connected!</h1>
            {displayName && (
              <p className="text-sm font-medium mb-1" style={{ color: "hsl(var(--dash-text-secondary, 220 10% 50%))" }}>
                Account: {displayName}
              </p>
            )}
            <p className="text-sm mb-6" style={{ color: "hsl(var(--dash-text-tertiary, 220 10% 65%))" }}>
              You can close this tab and return to your dashboard.
            </p>
            <p className="text-xs" style={{ color: "hsl(var(--dash-text-tertiary, 220 10% 65%))" }}>
              Redirecting in {countdown}...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold mb-2">Connection Failed</h1>
            <p className="text-sm mb-6" style={{ color: "hsl(var(--dash-text-secondary, 220 10% 50%))" }}>
              {errorMessage}
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: "hsl(var(--dash-accent, 220 80% 56%))" }}
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SocialCallback;
