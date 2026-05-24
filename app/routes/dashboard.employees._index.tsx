import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";

import Button from "~/components/Button";
import { GlobalErrorBoundary } from "~/components/GlobalErrorBoundary";
import DeleteIcon from "~/components/icons/Delete";
import EditIcon from "~/components/icons/Edit";
import ViewIcon from "~/components/icons/View";
import { formatDate } from "~/utils/formatDate";
import { getInitials } from "~/utils/getInitials";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

type Employee = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  work_email: string | null;
  profile_photo_url: string | null;
  status: string;
  employment_type: string;
  hire_date: string;
  departments: { name: string } | null;
  job_titles: { title: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  on_leave: "bg-amber-50 text-amber-700",
  terminated: "bg-rose-50 text-rose-700",
  inactive: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  on_leave: "On Leave",
  terminated: "Terminated",
  inactive: "Inactive",
};

export const meta: MetaFunction = () => [{ title: "Employees | Blevins HRIS" }];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const employeeId = formData.get("employeeId");

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", employeeId);

  if (error) throw new Response(error.message, { status: 500 });
  return Response.json({ message: "Employee deleted" });
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const supabase = getSupabaseClient();
  let query = supabase
    .from("employees")
    .select(
      `id, employee_number, first_name, last_name, preferred_name,
       work_email, profile_photo_url, status, employment_type, hire_date,
       departments(name), job_titles(title)`
    )
    .order("last_name");

  if (status) query = query.eq("status", status);

  const { data: employees, error } = await query;
  if (error) throw new Response(error.message, { status: 500 });
  return Response.json({ employees: employees ?? [] });
}

export default function EmployeeList() {
  const { employees } = useLoaderData<{ employees: Employee[] }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteFetcher = useFetcher();
  const currentStatus = searchParams.get("status") ?? "";

  const statusFilters = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "on_leave", label: "On Leave" },
    { value: "terminated", label: "Terminated" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">
          Employees
        </h1>
        <Button to="/dashboard/employees/new">Add Employee</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilters.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              if (s.value) params.set("status", s.value);
              else params.delete("status");
              setSearchParams(params);
            }}
            className={`px-3 py-1.5 text-sm rounded-full border transition ${
              currentStatus === s.value
                ? "bg-cyan-500 text-white border-cyan-500"
                : "bg-white text-slate-600 border-slate-300 hover:border-cyan-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="pb-10 overflow-x-auto bg-white shadow-md rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-6 font-medium text-left text-slate-900">
                {employees.length}{" "}
                {employees.length === 1 ? "employee" : "employees"}
              </th>
              <th className="p-6 font-medium text-left text-slate-900">
                Title / Dept
              </th>
              <th className="p-6 font-medium text-left text-slate-900">
                Status
              </th>
              <th className="p-6 font-medium text-left text-slate-900">
                Hire Date
              </th>
              <th className="p-6 font-medium text-left text-slate-900"></th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  No employees found.{" "}
                  <Link
                    to="/dashboard/employees/new"
                    className="text-cyan-600 hover:underline"
                  >
                    Add the first one.
                  </Link>
                </td>
              </tr>
            )}
            {employees.map((emp) => {
              const displayName = emp.preferred_name
                ? `${emp.preferred_name} ${emp.last_name}`
                : `${emp.first_name} ${emp.last_name}`;
              return (
                <tr
                  key={emp.id}
                  className="border-b border-slate-200 hover:border-cyan-300 transition"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      {emp.profile_photo_url ? (
                        <img
                          className="object-cover w-10 h-10 rounded-full"
                          src={emp.profile_photo_url}
                          alt={displayName}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 text-sm font-medium text-white rounded-full bg-cyan-500 shrink-0">
                          {getInitials(displayName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold">{displayName}</p>
                        <p className="text-slate-500 text-xs">
                          {emp.employee_number}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="font-medium">
                      {emp.job_titles?.title ?? "—"}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {emp.departments?.name ?? "—"}
                    </p>
                  </td>
                  <td className="p-6">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        STATUS_COLORS[emp.status] ?? ""
                      }`}
                    >
                      {STATUS_LABELS[emp.status] ?? emp.status}
                    </span>
                  </td>
                  <td className="p-6 whitespace-nowrap">
                    {formatDate(emp.hire_date)}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/dashboard/employees/${emp.id}`}
                        className="flex items-center justify-center w-8 h-8 rounded-md transition text-slate-300 hover:text-cyan-600 hover:bg-cyan-50"
                        aria-label="View"
                      >
                        <ViewIcon />
                      </Link>
                      <Link
                        to={`/dashboard/employees/${emp.id}/edit`}
                        className="flex items-center justify-center w-8 h-8 rounded-md transition text-slate-300 hover:text-cyan-600 hover:bg-cyan-50"
                        aria-label="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <deleteFetcher.Form method="POST">
                        <input
                          type="hidden"
                          name="employeeId"
                          value={emp.id}
                        />
                        <button
                          type="submit"
                          className="flex items-center justify-center w-8 h-8 rounded-md transition text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                          aria-label="Delete"
                          onClick={(e) => {
                            if (!confirm(`Delete ${displayName}?`))
                              e.preventDefault();
                          }}
                        >
                          <DeleteIcon />
                        </button>
                      </deleteFetcher.Form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GlobalErrorBoundary />;
}
