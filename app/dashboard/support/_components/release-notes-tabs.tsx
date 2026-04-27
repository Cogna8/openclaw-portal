"use client";

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cogna8/ui/components/ui/tabs";

type ReleaseNotesTabProps = {
  value: string;
  label: string;
  current?: boolean;
  children: ReactNode;
};

export function ReleaseNotesTab(_props: ReleaseNotesTabProps): null {
  return null;
}

export function ReleaseNotesTabs({
  defaultValue,
  children,
}: {
  defaultValue?: string;
  children: ReactNode;
}) {
  const tabs = Children.toArray(children)
    .filter(
      (child): child is ReactElement<ReleaseNotesTabProps> =>
        isValidElement(child) && child.type === ReleaseNotesTab,
    )
    .map((child) => child.props);

  const initial =
    defaultValue ??
    tabs.find((tab) => tab.current)?.value ??
    tabs[0]?.value;

  return (
    <Tabs defaultValue={initial} className="w-full">
      <TabsList className="mb-6">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
            {tab.current && (
              <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                Current
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="space-y-6"
        >
          {tab.children}
        </TabsContent>
      ))}
    </Tabs>
  );
}
