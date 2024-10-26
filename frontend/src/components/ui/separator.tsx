import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-gray-200 dark:bg-gray-800",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

const LabeledSeparator = ({
  label,
  orientation = "horizontal",
  className,
  ...props
}: {
  label: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}) => {
  return (
    <div className={cn("flex items-center justify-center", orientation === "vertical" ? "flex-col" : "flex-row", className)}>
      <Separator orientation={orientation} {...props}/>
      <span className="mx-4 text-white">{label}</span>
      <Separator orientation={orientation} {...props}/>
    </div>
  );
};


export { LabeledSeparator, Separator }
