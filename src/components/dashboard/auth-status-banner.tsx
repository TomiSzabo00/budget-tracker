"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface SessionData {
  status: string;
  daysRemaining: number;
  lastSyncAt: string | null;
  message: string | null;
}

export function AuthStatusBanner() {
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(setSession);
  }, []);

  if (!session) return null;

  if (session.status === "expired") {
    return (
      <Alert className="border-destructive bg-destructive/10 mb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">Banking Session Expired</p>
            <p className="text-sm text-muted-foreground">
              {session.message || "Your banking session has expired."}{" "}
              <a
                href="/auth/start"
                className="underline font-medium text-destructive"
                target="_blank"
              >
                Re-authenticate →
              </a>
            </p>
          </div>
          <Badge variant="destructive">Expired</Badge>
        </div>
      </Alert>
    );
  }

  return (
    <Alert className="border-green-500/30 bg-green-500/5 mb-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <p className="font-medium text-green-700">
            Session active — {session.daysRemaining} days remaining
          </p>
          {session.lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Last sync: {new Date(session.lastSyncAt).toLocaleString()}
            </p>
          )}
        </div>
        <Badge className="bg-green-600">Active</Badge>
      </div>
    </Alert>
  );
}
