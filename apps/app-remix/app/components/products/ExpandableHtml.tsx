import DOMPurify from "isomorphic-dompurify";
import {
  ExpandableHtml as BaseExpandableHtml,
  type ExpandableHtmlProps as BaseExpandableHtmlProps,
} from "@repo/ui";

type ExpandableHtmlProps = Omit<BaseExpandableHtmlProps, "sanitize">;

/**
 * ExpandableHtml with DOMPurify sanitization injected.
 * Wraps the @repo/ui version to provide XSS protection.
 */
export function ExpandableHtml(props: ExpandableHtmlProps) {
  return <BaseExpandableHtml {...props} sanitize={DOMPurify.sanitize} />;
}
