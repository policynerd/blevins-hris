import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import Button from "~/components/Button";
import { GlobalErrorBoundary } from "~/components/GlobalErrorBoundary";
import { formatDate } from "~/utils/formatDate";
import { getInitials } from "~/utils/getInitials";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

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

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contractor: "Contractor",
  intern: "Intern",
  seasonal: "Seasonal",
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data?.employee
      ? `${data.employee.first_name} ${data.employee.last_name} | Blevins HRIS`
      : "Employee | Blevins HRIS",
  },
];

export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.employeeId, "Missing employeeId param");

  const supabase = getSupabaseClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      `*, departments(id, name), job_titles(id, title),
       locations(id, name, city, state),
       manager:manager_id(id, first_name, last_name)`
    )
    .eq("id", params.employeeId)
    .single();

  if (error) throw new Response(error.message, { status: 500 });
  if (!employee) throw new Response("Employee not found", { status: 404 });

  const [{ data: addresses }, { data: emergencyContacts }] = await Promise.all([
    supabase
      .from("employee_addresses")
      .select("*")
      .eq("employee_id", params.employeeId)
      .order("is_primary", { ascending: false }),
    supabase
      .from("emergency_contacts")
      .select("*")
      .eq("employee_id", params.employeeId)
      .order("is_primary", { ascending: false }),
  ]);

  return Response.json({
    employee,
    addresses: addresses ?? [],
    emergencyContacts: emergencyContacts ?? [],
  });
}

type InfoRowProps = { label: string; value: string | null | undefined };
function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-slate-100 last:border-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-slate-900">{value ?? "—"}</p>
    </div>
  );
}

type SectionProps = { title: string; children: React.ReactNode };
function Section({ title, children }: SectionProps) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
      <h2 className="text-base font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function EmployeeDetail() {
  const { employee, addresses, emergencyContacts } =
    useLoaderData<typeof loader>();
  const displayName = employee.preferred_name
    ? `${employee.preferred_name} ${employee.last_name}`
    : `${employee.first_name} ${employee.last_name}`;
  const primaryAddress =
    (addresses as any[]).find((a) => a.is_primary) ?? (addresses as any[])[0];

  return (
    <>
      <div className="mb-6">
        <Link
          to="/dashboard/employees"
          className="text-sm text-slate-500 hover:underline"
        >
          &larr; Back to employees
        </Link>
      </div>

      {/* Profile header */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 lg:p-8">
          {employee.profile_photo_url ? (
            <img
              className="object-cover w-20 h-20 rounded-full ring-2 ring-cyan-300 shrink-0"
              src={employee.profile_photo_url}
              alt={displayName}
            />
          ) : (
            <div className="flex items-center justify-center w-20 h-20 text-xl font-medium text-white rounded-full bg-cyan-500 ring-2 ring-cyan-300 shrink-0">
              {getInitials(displayName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-slate-900">
                {displayName}
              </h1>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  STATUS_COLORS[employee.status] ?? ""
                }`}
              >
                {STATUS_LABELS[employee.status] ?? employee.status}
              </span>
            </div>
            <p className="text-slate-600">
              {(employee as any).job_titles?.title ?? "—"}
            </p>
            <p className="text-sm text-slate-400">
              {(employee as any).departments?.name ?? "—"} &bull;{" "}
              {employee.employee_number}
            </p>
          </div>
          <Button
            to={`/dashboard/employees/${employee.id}/edit`}
            variant="outlined"
          >
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Employment">
          <InfoRow label="Employee Number" value={employee.employee_number} />
          <InfoRow
            label="Employment Type"
            value={EMPLOYMENT_TYPE_LABELS[employee.employment_type]}
          />
          <InfoRow label="Hire Date" value={formatDate(employee.hire_date)} />
          <InfoRow
            label="Department"
            value={(employee as any).departments?.name}
          />
          <InfoRow
            label="Job Title"
            value={(employee as any).job_titles?.title}
          />
          <InfoRow
            label="Manager"
            value={
              (employee as any).manager
                ? `${(employee as any).manager.first_name} ${(employee as any).manager.last_name}`
                : null
            }
          />
          <InfoRow
            label="Location"
            value={
              (employee as any).locations
                ? (employee as any).locations.city
                  ? `${(employee as any).locations.name} (${(employee as any).locations.city}, ${(employee as any).locations.state})`
                  : (employee as any).locations.name
                : null
            }
          />
          {employee.termination_date && (
            <InfoRow
              label="Termination Date"
              value={formatDate(employee.termination_date)}
            />
          )}
          {employee.termination_reason && (
            <InfoRow
              label="Termination Reason"
              value={employee.termination_reason}
            />
          )}
        </Section>

        <Section title="Compensation">
          <InfoRow
            label="Pay Type"
            value={employee.pay_type === "salary" ? "Salary" : "Hourly"}
          />
          {employee.pay_type === "salary" && (
            <InfoRow
              label="Annual Salary"
              value={
                employee.salary
                  ? `$${Number(employee.salary).toLocaleString()}`
                  : null
              }
            />
          )}
          {employee.pay_type === "hourly" && (
            <InfoRow
              label="Hourly Rate"
              value={
                employee.hourly_rate
                  ? `$${Number(employee.hourly_rate).toFixed(2)}/hr`
                  : null
              }
            />
          )}
        </Section>

        <Section title="Contact Information">
          <InfoRow label="Work Email" value={employee.work_email} />
          <InfoRow label="Work Phone" value={employee.work_phone} />
          <InfoRow label="Personal Email" value={employee.personal_email} />
          <InfoRow label="Personal Phone" value={employee.personal_phone} />
        </Section>

        <Section title="Personal Information">
          <InfoRow label="First Name" value={employee.first_name} />
          <InfoRow label="Last Name" value={employee.last_name} />
          {employee.preferred_name && (
            <InfoRow label="Preferred Name" value={employee.preferred_name} />
          )}
          <InfoRow
            label="Date of Birth"
            value={
              employee.date_of_birth
                ? formatDate(employee.date_of_birth)
                : null
            }
          />
        </Section>

        {primaryAddress && (
          <Section title="Home Address">
            <InfoRow
              label="Street"
              value={[
                primaryAddress.address_line1,
                primaryAddress.address_line2,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <InfoRow label="City" value={primaryAddress.city} />
            <InfoRow label="State" value={primaryAddress.state} />
            <InfoRow label="Zip" value={primaryAddress.zip} />
            <InfoRow label="Country" value={primaryAddress.country} />
          </Section>
        )}

        {(emergencyContacts as any[]).length > 0 && (
          <Section title="Emergency Contacts">
            {(emergencyContacts as any[]).map((contact) => (
              <div
                key={contact.id}
                className="py-3 border-b border-slate-100 last:border-0"
              >
                <p className="text-sm font-medium text-slate-900">
                  {contact.name}
                  {contact.is_primary && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-cyan-50 text-cyan-700 rounded">
                      Primary
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {contact.relationship} &bull; {contact.phone}
                </p>
                {contact.email && (
                  <p className="text-xs text-slate-500">{contact.email}</p>
                )}
              </div>
            ))}
          </Section>
        )}

        {employee.notes && (
          <Section title="Notes">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {employee.notes}
            </p>
          </Section>
        )}
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GlobalErrorBoundary />;
}
