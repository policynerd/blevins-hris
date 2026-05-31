import { redirect } from "@remix-run/node";

import { GlobalErrorBoundary } from "~/components/GlobalErrorBoundary";

export async function loader() {
  return redirect("/dashboard/employees");
}

export function ErrorBoundary() {
  return <GlobalErrorBoundary />;
}
