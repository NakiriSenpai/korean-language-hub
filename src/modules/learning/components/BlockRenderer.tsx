import type { BlockContent, CalloutTone, LessonBlock } from "@/modules/learning/types";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/shared/platform";

const CALLOUT_TONE: Record<CalloutTone, string> = {
  info: "border-primary/40 bg-primary/5 text-text-primary",
  success: "border-success/40 bg-success/5 text-text-primary",
  warning: "border-warning/40 bg-warning/5 text-text-primary",
  danger: "border-destructive/40 bg-destructive/5 text-text-primary",
};

function Caption({ text }: { text?: string | undefined }) {
  if (!text) return null;
  return <figcaption className="text-caption text-text-secondary">{text}</figcaption>;
}

function renderBlock(type: LessonBlock["type"], content: BlockContent) {
  switch (type) {
    case "text":
      return (
        <p className="whitespace-pre-line text-body text-text-primary">{content.text ?? ""}</p>
      );
    case "image":
      return content.url ? (
        <figure className="flex flex-col gap-xs">
          <img
            src={optimizeImageUrl(content.url, 960)}
            alt={content.alt ?? content.caption ?? "Ilustrasi materi"}
            loading="lazy"
            decoding="async"
            className="w-full rounded-lg border border-border object-cover"
          />
          <Caption text={content.caption} />
        </figure>
      ) : null;
    case "audio":
      return content.url ? (
        <figure className="flex flex-col gap-xs">
          <audio controls preload="none" src={content.url} className="w-full">
            <track kind="captions" />
          </audio>
          <Caption text={content.caption} />
        </figure>
      ) : null;
    case "video":
      return content.url ? (
        <figure className="flex flex-col gap-xs">
          <video controls preload="none" src={content.url} className="w-full rounded-lg">
            <track kind="captions" />
          </video>
          <Caption text={content.caption} />
        </figure>
      ) : null;
    case "quote":
      return (
        <blockquote className="border-l-4 border-primary/50 pl-md">
          <p className="text-body italic text-text-primary">{content.text ?? ""}</p>
          {content.author && (
            <cite className="mt-xs block text-caption not-italic text-text-secondary">
              — {content.author}
            </cite>
          )}
        </blockquote>
      );
    case "divider":
      return <hr className="border-border" />;
    case "callout":
      return (
        <div className={cn("rounded-lg border p-md", CALLOUT_TONE[content.tone ?? "info"])}>
          {content.title && <p className="text-title text-text-primary">{content.title}</p>}
          <p className="mt-xs whitespace-pre-line text-body-sm text-text-secondary">
            {content.text ?? ""}
          </p>
        </div>
      );
    default:
      return null;
  }
}

/** Renders one content block. Read only — the visual editor is out of scope. */
export function BlockRenderer({ block }: { block: LessonBlock }) {
  return <div className="min-w-0">{renderBlock(block.type, block.content)}</div>;
}

/** Renders an ordered list of blocks with consistent vertical rhythm. */
export function BlockList({ blocks }: { blocks: readonly LessonBlock[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-md">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
