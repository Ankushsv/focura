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
    <Card className="p-5 bg-warm-surface border border-warm-border">
      <h2 className="text-xs font-quick font-bold uppercase tracking-widest text-warm-amber flex items-center gap-1.5 mb-4">
        🏆 Completed Tasks
      </h2>
      {completed.length === 0 ? (
        <p className="text-xs font-quick text-warm-textMuted leading-relaxed">
          Your completed tasks will appear here. Complete a task to start.
        </p>
      ) : (
        <ul className="space-y-4">
          {completed.map((t) => (
            <li
              key={t.id}
              className="relative border-l-2 border-warm-amber bg-warm-surface2 rounded-r-xl p-3 shadow-sm"
              style={{
                backgroundImage: "linear-gradient(to right, rgba(240, 168, 104, 0.03), transparent)",
              }}
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] font-quick font-bold text-warm-amber uppercase tracking-wider">
                  {t.isBoss ? "⚡ milestone" : "✓ completed"}
                </span>
                <span className="ml-auto font-mono text-[10px] text-warm-textMuted">
                  +{t.xp} XP
                </span>
              </div>
              <p className="font-quick font-bold text-sm text-warm-text mt-1 truncate">
                {t.title}
              </p>
              {t.memoryNote && (
                <p className="font-quick italic text-xs text-warm-cream/80 mt-2 border-t border-warm-border/40 pt-2 flex items-start gap-1">
                  <IconBook className="h-3.5 w-3.5 shrink-0 text-warm-amber" />
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
