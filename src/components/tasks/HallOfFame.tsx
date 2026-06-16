"use client";

import Card from "@/components/ui/Card";
import type { Task } from "@/lib/tasks/types";
import { IconBook } from "@tabler/icons-react";

export default function HallOfLegends({ tasks }: { tasks: Task[] }) {
  const completed = tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 8);

  return (
    <Card className="p-5 bg-realm-surface border border-realm-border">
      <h2 className="text-xs font-quick font-bold uppercase tracking-widest text-realm-gold flex items-center gap-1.5 mb-4">
        🏆 Hall of Legends
      </h2>
      {completed.length === 0 ? (
        <p className="text-xs font-quick text-realm-muted leading-relaxed">
          Your victories will appear here. The Scroll awaits your first triumph.
        </p>
      ) : (
        <ul className="space-y-4">
          {completed.map((t) => (
            <li
              key={t.id}
              className="relative border-l-2 border-[#f0a868] bg-[#1c1916] rounded-r-xl p-3 shadow-sm"
              style={{
                backgroundImage: "linear-gradient(to right, rgba(240, 168, 104, 0.03), transparent)",
              }}
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] font-quick font-bold text-realm-gold uppercase tracking-wider">
                  {t.isBoss ? "⚔️ boss down" : "✓ victory"}
                </span>
                <span className="ml-auto font-mono text-[10px] text-realm-muted">
                  +{t.xp} LP
                </span>
              </div>
              <p className="font-quick font-bold text-sm text-[#f5efe8] mt-1 truncate">
                {t.title}
              </p>
              {t.memoryNote && (
                <p className="font-lora italic text-xs text-realm-cream/80 mt-2 border-t border-realm-border/40 pt-2 flex items-start gap-1">
                  <IconBook className="h-3.5 w-3.5 shrink-0 text-realm-gold" />
                  <span>&ldquo;{t.memoryNote}&rdquo;</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
