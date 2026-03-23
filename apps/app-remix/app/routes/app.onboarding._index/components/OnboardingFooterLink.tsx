import React from "react";

interface OnboardingFooterLinkProps {
  url: string;
  children: React.ReactNode;
}

export function OnboardingFooterLink({ url, children }: OnboardingFooterLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "var(--p-color-text-link)", textDecoration: "underline" }}
    >
      {children}
    </a>
  );
}
