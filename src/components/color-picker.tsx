"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#8b5cf6",
  "#ec4899", "#f43f5e", "#64748b", "#0ea5e9",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "w-8 h-8 rounded-full border-2 border-border cursor-pointer hover:ring-2 hover:ring-ring/50 transition-all focus:outline-none focus:ring-2 focus:ring-ring",
          className
        )}
        style={{ backgroundColor: value }}
        aria-label="Pick a color"
      />
      <PopoverContent className="w-52 p-3" align="start">
        <div className="grid grid-cols-6 gap-2 mb-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform focus:outline-none",
                value === color && "ring-2 ring-offset-1 ring-ring"
              )}
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
                setCustom(color);
                setOpen(false);
              }}
            />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div
            className="w-6 h-6 rounded-full shrink-0 border border-border"
            style={{ backgroundColor: custom }}
          />
          <Input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                onChange(e.target.value);
              }
            }}
            placeholder="#000000"
            className="h-7 text-xs font-mono"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
