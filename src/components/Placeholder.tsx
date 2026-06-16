const PROJECT_URL = "https://gitlab.com/ankushsinghv771-group/focura";

export default function Placeholder({
  emoji,
  title,
  issue,
}: {
  emoji: string;
  title: string;
  issue: number;
}) {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <div className="text-5xl" role="img" aria-hidden>
        {emoji}
      </div>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        This module is on the roadmap and ready to build.
      </p>
      <a
        href={`${PROJECT_URL}/-/issues/${issue}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
      >
        Full spec in issue #{issue}
      </a>
    </div>
  );
}
