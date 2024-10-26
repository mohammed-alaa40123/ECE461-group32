import React from "react";
import { cn } from "../../lib/utils";

type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-gray-200 dark:bg-gray-800",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

// LabeledSeparator Component
type LabeledSeparatorProps = {
  label: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
};

const LabeledSeparator: React.FC<LabeledSeparatorProps> = ({
  label,
  orientation = "horizontal",
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
    >
      <Separator orientation={orientation} {...props} />
      <span className="mx-4 text-white">{label}</span>
      <Separator orientation={orientation} {...props} />
    </div>
  );
};

export { LabeledSeparator, Separator };
