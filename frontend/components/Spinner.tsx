import { SpinnerIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <SpinnerIcon
      role="status"
      aria-label="Loading"
      className={cn("size-10 animate-spin", className)}
      {...props}
    />
  )
}

export default function SpinnerCustom() {
  return (
    <div className="flex w-full min-h-[calc(100vh-4rem)] justify-center items-center">
      <Spinner />
    </div>
  )
}
