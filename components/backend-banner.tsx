"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "@/src/metadata/endpoints";
import { ServerIcon, CodeIcon, CheckIcon, CopyIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface BackendBannerProps {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  description: string;
  schemaExample?: Record<string, any> | any[];
}

export function BackendBanner({
  endpoint,
  method = "GET",
  description,
  schemaExample,
}: BackendBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = API_CONFIG.baseUrl
    ? `${API_CONFIG.baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`
    : endpoint;

  const isLive = Boolean(API_CONFIG.baseUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 dark:bg-card/40 p-3.5 transition-all text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-background/80 dark:bg-zinc-900/80 px-2.5 py-1 rounded-md border border-border/50">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{method}</span>
            <span className="text-foreground">{endpoint}</span>
          </div>
          <Badge
            variant={isLive ? "default" : "outline"}
            className="flex items-center gap-1 text-[10px] font-mono py-0.5"
          >
            <span
              className={`size-1.5 rounded-full ${
                isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>{isLive ? "Live API Connected" : "Local Metadata Active"}</span>
          </Badge>
          <span className="text-muted-foreground hidden md:inline text-[11px]">{description}</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 text-[11px] gap-1 cursor-pointer"
          >
            {copied ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
            <span>{copied ? "Copied" : "Copy Endpoint"}</span>
          </Button>

          {schemaExample && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className="h-7 text-[11px] gap-1 cursor-pointer"
            >
              <CodeIcon className="size-3" />
              <span>Backend Schema</span>
              {isOpen ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
            </Button>
          )}
        </div>
      </div>

      {isOpen && schemaExample && (
        <div className="mt-3 pt-3 border-t border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-foreground">
              Expected Backend Response JSON Payload:
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Return this format from your server
            </span>
          </div>
          <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-950 p-2.5 text-[11px] font-mono text-zinc-300 border border-zinc-800">
            {JSON.stringify(schemaExample, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
