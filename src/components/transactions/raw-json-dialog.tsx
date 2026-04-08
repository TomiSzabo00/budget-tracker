"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  txHash: string;
  rawPayload: string;
}

export function RawJsonDialog({ open, onClose, txHash, rawPayload }: Props) {
  let formatted = rawPayload;
  try {
    formatted = JSON.stringify(JSON.parse(rawPayload), null, 2);
  } catch {
    // use as-is if not valid JSON
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    toast.success("Copied to clipboard");
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
            className="absolute top-2 right-2 z-10 p-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <pre
            className="text-xs font-mono rounded p-4 overflow-auto max-h-[60vh] leading-relaxed"
            style={{ backgroundColor: "var(--color-code-bg)", color: "var(--color-code-fg)" }}
          >
            {formatted}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
