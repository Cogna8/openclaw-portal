"use client";

// LOCAL OVERRIDE — delete when @cogna8/ui ships the orientation selector fix
// AND the active pill radius fix (expected in 1.0.3+). Then revert
// app/dashboard/support/_components/tabs-client.tsx to import from
// @cogna8/ui/components/ui/tabs.
//
// Bug 1: @cogna8/ui Tabs uses `data-horizontal:` / `data-vertical:` shorthand
// which compiles to [data-horizontal] / [data-vertical] (attribute-name match)
// but Radix emits `data-orientation="horizontal"` (attribute-value). The
// orientation classes silently never fire, breaking horizontal layout.
//
// Bug 2: Active pill is rounded-md (8px) inside a rounded-lg (10px) TabsList,
// producing a 2px concentric mismatch. Pill should match container.
//
// Note: this override drops the `line` variant from @cogna8/ui's Tabs because
// the portal only uses the default variant. If a `line` variant is needed
// later, restore the cva block — but add `class-variance-authority` as a
// direct dep first (it's only transitively available today).

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@cogna8/ui/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant="default"
      className={cn(
        "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground bg-muted group-data-[orientation=horizontal]/tabs:h-8 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground data-active:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
