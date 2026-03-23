/** @jsxImportSource preact */
import { h } from "preact";

const SIZE_MAP = {
  xlarge: "sw-heading--xlarge",
  large: "sw-heading--large",
  medium: "sw-heading--medium",
  small: "sw-heading--small",
  xsmall: "sw-heading--xsmall",
};

export function Heading({
  text,
  tag = "h3",
  size = "medium",
  alignment = "left",
}: {
  text: string;
  tag?: "h2" | "h3" | "h4" | "h5";
  size?: "xlarge" | "large" | "medium" | "small" | "xsmall";
  alignment?: "left" | "center";
}) {
  const Tag = tag;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.medium;

  return (
    <Tag class={`sw-heading ${sizeClass}`} style={{ textAlign: alignment }}>{text}</Tag>
  );
}
