import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <Badge>{eyebrow}</Badge>
          <div className="space-y-2">
            <h1 className="display-font text-3xl leading-none tracking-tight text-[var(--foreground)] md:text-[2.6rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-[15px]">
              {description}
            </p>
          </div>
        </div>
        {aside ? <div className="lg:max-w-[320px]">{aside}</div> : null}
      </div>
    </div>
  );
}
