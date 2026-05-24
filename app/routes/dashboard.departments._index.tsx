import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";

import Button from "~/components/Button";
import { GlobalErrorBoundary } from "~/components/GlobalErrorBoundary";
import DeleteIcon from "~/components/icons/Delete";
import EditIcon from "~/components/icons/Edit";
import { createClient } from "~/utils/supabase.server";

type Department = {
  id: string;
  name: string;
  description: string | null;
  cost_center: string | null;
  employee_count: number;
};

export const meta: MetaFunction = () => [
  { title: "Departments | Blevins HRIS" },
];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const departmentId = formData.get("departmentId");
  const { supabase } = createClient(request);
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", departmentId);
  if (error) throw new Response(error.message, { status: 500 });
  return Response.json({ message: "Department deleted" });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase } = createClient(request);
  const [{ data: departments, error }, { data: empCounts }] = await Promise.all([
    supabase.from("departments").select("id, name, description, cost_center").order("name"),
    supabase.from("employees").select("department_id").eq("status", "active"),
  ]);
  if (error) throw new Response(error.message, { status: 500 });

  const countMap: Record<string, number> = {};
  for (const emp of empCounts ?? []) {
    if (emp.department_id) {
      countMap[emp.department_id] = (countMap[emp.department_id] ?? 0) + 1;
    }
  }

  const enriched = (departments ?? []).map((d) => ({
    ...d,
    employee_count: countMap[d.id] ?? 0,
  }));

  return Response.json({ departments: enriched });
}

export default function DepartmentList() {
  const { departments } = useLoaderData<{ departments: Department[] }>();
  const deleteFetcher = useFetcher();

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">Departments</h1>
        <Button to="/dashboard/departments/new">Add Department</Button>
      </div>

      <div className="pb-10 overflow-x-auto bg-white shadow-md rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-6 font-medium text-left text-slate-900">
                {departments.length} {departments.length === 1 ? "department" : "departments"}
              </th>
              <th className="p-6 font-medium text-left text-slate-900">Cost Center</th>
              <th className="p-6 font-medium text-left text-slate-900">Active Employees</th>
              <th className="p-6 font-medium text-left text-slate-900"></th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400">
                  No departments yet.{" "}
                  <Link to="/dashboard/departments/new" className="text-cyan-600 hover:underline">Add the first one.</Link>
                </td>
              </tr>
            )}
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b border-slate-200 hover:border-cyan-300 transition">
                <td className="p-6">
                  <p className="font-semibold">{dept.name}</p>
                  {dept.description && <p className="text-xs text-slate-500 mt-0.5">{dept.description}</p>}
                </td>
                <td className="p-6">{dept.cost_center ?? "—"}</td>
                <td className="p-6">
                  <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">{dept.employee_count}</span>
                </td>
                <td className="p-6">
                  <div className="flex justify-end gap-2">
                    <Link to={`/dashboard/departments/${dept.id}/edit`} className="flex items-center justify-center w-8 h-8 rounded-md transition text-slate-300 hover:text-cyan-600 hover:bg-cyan-50" aria-label="Edit">
                      <EditIcon />
                    </Link>
                    <deleteFetcher.Form method="POST">
                      <input type="hidden" name="departmentId" value={dept.id} />
                      <button type="submit" className="flex items-center justify-center w-8 h-8 rounded-md transition text-slate-300 hover:text-rose-600 hover:bg-rose-50" aria-label="Delete"
                        onClick={(e) => { if (!confirm(`Delete ${dept.name}?`)) e.preventDefault(); }}>
                        <DeleteIcon />
                      </button>
                    </deleteFetcher.Form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GlobalErrorBoundary />;
}
