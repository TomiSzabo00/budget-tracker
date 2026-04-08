"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  txHash: string;
  rawPayload: string;
}

export function RawJsonDialog({ open, onClose, txHash, rawPayload }: Props) {
  const [copied, setCopied] = useState(false);

  let formatted = rawPayload;
  try {
    formatted = JSON.stringify(JSON.parse(rawPayload), null, 2);
  } catch {
    // use as-is if not valid JSON
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl w-fit max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm text-muted-foreground font-normal">
            Raw Payload
            <span className="ml-2 text-xs opacity-60 truncate">{txHash}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 overflow-hidden">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 p-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <pre className="bg-zinc-900 text-zinc-100 text-xs font-mono rounded p-4 overflow-auto max-h-[60vh] leading-relaxed">
            {formatted}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
