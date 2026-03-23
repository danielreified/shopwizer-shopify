// Re-export from @repo/ui with react-router Link integration
import React from "react";
import { Link } from "react-router";
import {
  SidebarItem as BaseSidebarItem,
  type SidebarItemProps as BaseSidebarItemProps,
} from "@repo/ui";

export {
  SidebarHeader,
  SidebarCard,
  SidebarGroup,
  SidebarDivider,
  type SidebarHeaderProps,
  type SidebarCardProps,
  type SidebarGroupProps,
} from "@repo/ui";

// Wrap SidebarItem to inject react-router Link as the link renderer
export type SidebarItemProps = Omit<BaseSidebarItemProps, "renderLink">;

export function SidebarItem(props: SidebarItemProps) {
  return (
    <BaseSidebarItem
      {...props}
      renderLink={({ to, children }) => (
        <Link
          to={to}
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "block",
            width: "100%",
          }}
        >
          {children}
        </Link>
      )}
    />
  );
}
