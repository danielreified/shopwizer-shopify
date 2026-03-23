import { useRouteError, isRouteErrorResponse } from "react-router";
import { Page } from "@shopify/polaris";
import { ErrorDisplay } from "@repo/ui";

/**
 * Route-level error boundary that uses react-router's useRouteError hook
 * and renders the generic ErrorDisplay from @repo/ui.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  let title: string | undefined;
  let message: string | undefined;
  let statusCode: number | undefined;
  let statusText: string | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    statusText = error.statusText || undefined;
    message =
      typeof error.data === "string"
        ? error.data
        : "The requested page could not be loaded.";
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <Page>
      <ErrorDisplay
        title={title}
        message={message}
        statusCode={statusCode}
        statusText={statusText}
      />
    </Page>
  );
}
