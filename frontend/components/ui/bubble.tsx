"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"

const bubbleVariants = cva(
  "relative w-fit max-w-[80%] rounded-2xl px-3.5 py-2 text-sm [overflow-wrap:anywhere]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-muted-foreground",
        tinted: "bg-primary/10 text-foreground",
        outline: "border border-border bg-background text-foreground",
        ghost: "max-w-full bg-transparent px-0 py-0 text-foreground",
        destructive: "bg-destructive text-white",
      },
      align: {
        start: "rounded-bl-sm",
        end: "rounded-br-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "start",
    },
  }
)

function Bubble({
  className,
  variant = "default",
  align = "start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof bubbleVariants>) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant, align }), className)}
      {...props}
    />
  )
}

function BubbleContent({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      "data-slot": "bubble-content",
      className: cn("whitespace-pre-wrap text-sm leading-relaxed", className),
      ...props,
    },
  })
}

function BubbleReactions({
  className,
  side = "bottom",
  align = "end",
  ...props
}: React.ComponentProps<"div"> & {
  side?: "top" | "bottom"
  align?: "start" | "end"
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-side={side}
      data-align={align}
      className={cn(
        "flex w-fit items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-xs shadow-sm",
        align === "start" ? "self-start" : "self-end",
        className
      )}
      {...props}
    />
  )
}

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex w-fit flex-col gap-1", className)}
      {...props}
    />
  )
}

export {
  Bubble,
  BubbleContent,
  BubbleReactions,
  BubbleGroup,
  bubbleVariants,
}
