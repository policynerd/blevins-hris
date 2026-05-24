import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";

import Button from "~/components/Button";
import { GlobalErrorBoundary } from "~/components/GlobalErrorBoundary";
import TextField from "~/components/TextField";
import { createClient } from "~/utils/supabase.server";

export const meta: MetaFunction = () => [
  { title: "New Department | Blevins HRIS" },
];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { supabase } = createClient(request);
  const { error } = await supabase.from("departments").insert([{
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    cost_center: (formData.get("cost_center") as string) || null,
  }]);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return redirect("/dashboard/departments");
}

export default function NewDepartment() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <>
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">New Department</h1>
        <Link to="/dashboard/departments" className="text-sm text-slate-500 hover:underline">&larr; Back to departments</Link>
      </div>
      <div className="bg-white shadow-md rounded-xl p-6 lg:p-8 max-w-2xl">
        <Form method="POST">
          {actionData?.error && (
            <p className="p-3 mb-4 text-sm rounded-md bg-rose-50 text-rose-700">{actionData.error}</p>
          )}
          <fieldset className="space-y-4 disabled:opacity-70" disabled={isSubmitting}>
            <TextField id="name" name="name" label="Department Name" required placeholder="Engineering" />
            <div>
              <label htmlFor="description" className="block mb-2 text-sm tracking-wide text-slate-700">Description</label>
              <textarea id="description" name="description" rows={3} className="block w-full rounded-md border p-3 text-sm text-slate-700 transition border-slate-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none resize-none" placeholder="What this department does..." />
            </div>
            <TextField id="cost_center" name="cost_center" label="Cost Center" placeholder="CC-1234" />
            <div className="flex items-center justify-end gap-4 pt-2">
              <Button to="/dashboard/departments" variant="outlined">Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Create Department</Button>
            </div>
          </fieldset>
        </Form>
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GlobalErrorBoundary />;
}
