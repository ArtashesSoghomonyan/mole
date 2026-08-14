"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Message({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end"
}) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        "group flex w-full items-end gap-3",
        align === "start" ? "justify-start" : "justify-end",
        className
      )}
      {...props}
    />
  )
}

function MessageGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-group"
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        "flex shrink-0 self-end group-data-[align=end]:order-2",
        className
      )}
      {...props}
    />
  )
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        "flex min-w-0 max-w-full flex-col gap-1.5 group-data-[align=start]:items-start group-data-[align=end]:items-end",
        className
      )}
      {...props}
    />
  )
}

function MessageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        "flex items-center gap-1.5 px-1 text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        "flex items-center gap-1.5 px-1 text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Message,
  MessageGroup,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
}
