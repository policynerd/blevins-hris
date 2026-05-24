import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import Button from "~/components/Button";
import { GlobalErrorBoundary } from "~/components/GlobalErrorBoundary";
import SelectField from "~/components/SelectField";
import TextField from "~/components/TextField";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data?.employee
      ? `Edit ${data.employee.first_name} ${data.employee.last_name} | Blevins HRIS`
      : "Edit Employee | Blevins HRIS",
  },
];

export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.employeeId, "Missing employeeId param");
  const supabase = getSupabaseClient();

  const [
    { data: employee, error },
    { data: departments },
    { data: jobTitles },
    { data: locations },
    { data: managers },
    { data: primaryAddress },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("id", params.employeeId).single(),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("job_titles").select("id, title").order("title"),
    supabase.from("locations").select("id, name").order("name"),
    supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .neq("id", params.employeeId)
      .order("last_name"),
    supabase
      .from("employee_addresses")
      .select("*")
      .eq("employee_id", params.employeeId)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  if (error) throw new Response(error.message, { status: 500 });
  if (!employee) throw new Response("Employee not found", { status: 404 });

  return Response.json({
    employee,
    departments: departments ?? [],
    jobTitles: jobTitles ?? [],
    locations: locations ?? [],
    managers: managers ?? [],
    primaryAddress: primaryAddress ?? null,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  invariant(params.employeeId, "Missing employeeId param");
  const formData = await request.formData();
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("employees")
    .update({
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      preferred_name: (formData.get("preferred_name") as string) || null,
      date_of_birth: (formData.get("date_of_birth") as string) || null,
      work_email: (formData.get("work_email") as string) || null,
      personal_email: (formData.get("personal_email") as string) || null,
      work_phone: (formData.get("work_phone") as string) || null,
      personal_phone: (formData.get("personal_phone") as string) || null,
      profile_photo_url: (formData.get("profile_photo_url") as string) || null,
      hire_date: formData.get("hire_date") as string,
      employment_type: formData.get("employment_type") as string,
      status: formData.get("status") as string,
      department_id: (formData.get("department_id") as string) || null,
      job_title_id: (formData.get("job_title_id") as string) || null,
      location_id: (formData.get("location_id") as string) || null,
      manager_id: (formData.get("manager_id") as string) || null,
      pay_type: formData.get("pay_type") as string,
      salary: formData.get("salary") ? Number(formData.get("salary")) : null,
      hourly_rate: formData.get("hourly_rate")
        ? Number(formData.get("hourly_rate"))
        : null,
      termination_date:
        (formData.get("termination_date") as string) || null,
      termination_reason:
        (formData.get("termination_reason") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", params.employeeId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const addressLine1 = formData.get("address_line1") as string;
  const addressId = formData.get("address_id") as string;
  if (addressLine1) {
    const addressData = {
      employee_id: params.employeeId,
      address_type: "home" as const,
      address_line1: addressLine1,
      address_line2: (formData.get("address_line2") as string) || null,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      country: (formData.get("country") as string) || "US",
      is_primary: true,
    };
    if (addressId) {
      await supabase
        .from("employee_addresses")
        .update(addressData)
        .eq("id", addressId);
    } else {
      await supabase.from("employee_addresses").insert([addressData]);
    }
  }

  return redirect(`/dashboard/employees/${params.employeeId}`);
}

export default function EditEmployee() {
  const { employee, departments, jobTitles, locations, managers, primaryAddress } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const deptOptions = [
    { value: "", label: "— No Department —" },
    ...(departments as any[]).map((d) => ({ value: d.id, label: d.name })),
  ];
  const titleOptions = [
    { value: "", label: "— No Job Title —" },
    ...(jobTitles as any[]).map((t) => ({ value: t.id, label: t.title })),
  ];
  const locationOptions = [
    { value: "", label: "— No Location —" },
    ...(locations as any[]).map((l) => ({ value: l.id, label: l.name })),
  ];
  const managerOptions = [
    { value: "", label: "— No Manager —" },
    ...(managers as any[]).map((m) => ({
      value: m.id,
      label: `${m.first_name} ${m.last_name}`,
    })),
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "on_leave", label: "On Leave" },
    { value: "terminated", label: "Terminated" },
    { value: "inactive", label: "Inactive" },
  ];
  const employmentTypeOptions = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contractor", label: "Contractor" },
    { value: "intern", label: "Intern" },
    { value: "seasonal", label: "Seasonal" },
  ];
  const payTypeOptions = [
    { value: "salary", label: "Salary" },
    { value: "hourly", label: "Hourly" },
  ];

  return (
    <>
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">
          Edit Employee
        </h1>
        <Link
          to={`/dashboard/employees/${employee.id}`}
          className="text-sm text-slate-500 hover:underline"
        >
          &larr; Back to {employee.first_name} {employee.last_name}
        </Link>
      </div>

      <Form method="POST">
        {actionData?.error && (
          <p className="p-3 mb-6 text-sm rounded-md bg-rose-50 text-rose-700">
            {actionData.error}
          </p>
        )}
        <fieldset className="space-y-6 disabled:opacity-70" disabled={isSubmitting}>
          {/* Personal Information */}
          <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Personal Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                id="first_name"
                name="first_name"
                label="First Name"
                required
                defaultValue={employee.first_name}
              />
              <TextField
                id="last_name"
                name="last_name"
                label="Last Name"
                required
                defaultValue={employee.last_name}
              />
              <TextField
                id="preferred_name"
                name="preferred_name"
                label="Preferred Name"
                defaultValue={employee.preferred_name ?? ""}
              />
              <TextField
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                label="Date of Birth"
                defaultValue={employee.date_of_birth ?? ""}
              />
              <TextField
                id="profile_photo_url"
                name="profile_photo_url"
                type="url"
                label="Profile Photo URL"
                defaultValue={employee.profile_photo_url ?? ""}
              />
            </div>
          </div>

          {/* Employment */}
          <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Employment
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                id="hire_date"
                name="hire_date"
                type="date"
                label="Hire Date"
                required
                defaultValue={employee.hire_date}
              />
              <SelectField
                id="status"
                name="status"
                label="Status"
                required
                defaultValue={employee.status}
                options={statusOptions}
              />
              <SelectField
                id="employment_type"
                name="employment_type"
                label="Employment Type"
                required
                defaultValue={employee.employment_type}
                options={employmentTypeOptions}
              />
              <SelectField
                id="department_id"
                name="department_id"
                label="Department"
                defaultValue={employee.department_id ?? ""}
                options={deptOptions}
              />
              <SelectField
                id="job_title_id"
                name="job_title_id"
                label="Job Title"
                defaultValue={employee.job_title_id ?? ""}
                options={titleOptions}
              />
              <SelectField
                id="location_id"
                name="location_id"
                label="Location"
                defaultValue={employee.location_id ?? ""}
                options={locationOptions}
              />
              <SelectField
                id="manager_id"
                name="manager_id"
                label="Reports To"
                defaultValue={employee.manager_id ?? ""}
                options={managerOptions}
              />
              <TextField
                id="termination_date"
                name="termination_date"
                type="date"
                label="Termination Date"
                defaultValue={employee.termination_date ?? ""}
              />
              <div className="sm:col-span-2">
                <TextField
                  id="termination_reason"
                  name="termination_reason"
                  label="Termination Reason"
                  defaultValue={employee.termination_reason ?? ""}
                />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Compensation
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField
                id="pay_type"
                name="pay_type"
                label="Pay Type"
                required
                defaultValue={employee.pay_type}
                options={payTypeOptions}
              />
              <TextField
                id="salary"
                name="salary"
                type="number"
                label="Annual Salary ($)"
                defaultValue={employee.salary?.toString() ?? ""}
              />
              <TextField
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                label="Hourly Rate ($)"
                defaultValue={employee.hourly_rate?.toString() ?? ""}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Contact Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="work_email"
                name="work_email"
                type="email"
                label="Work Email"
                defaultValue={employee.work_email ?? ""}
              />
              <TextField
                id="work_phone"
                name="work_phone"
                label="Work Phone"
                defaultValue={employee.work_phone ?? ""}
              />
              <TextField
                id="personal_email"
                name="personal_email"
                type="email"
                label="Personal Email"
                defaultValue={employee.personal_email ?? ""}
              />
              <TextField
                id="personal_phone"
                name="personal_phone"
                label="Personal Phone"
                defaultValue={employee.personal_phone ?? ""}
              />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Home Address
            </h2>
            {(primaryAddress as any)?.id && (
              <input
                type="hidden"
                name="address_id"
                value={(primaryAddress as any).id}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField
                  id="address_line1"
                  name="address_line1"
                  label="Street Address"
                  defaultValue={(primaryAddress as any)?.address_line1 ?? ""}
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  id="address_line2"
                  name="address_line2"
                  label="Apt / Suite / Unit"
                  defaultValue={(primaryAddress as any)?.address_line2 ?? ""}
                />
              </div>
              <TextField
                id="city"
                name="city"
                label="City"
                defaultValue={(primaryAddress as any)?.city ?? ""}
              />
              <TextField
                id="state"
                name="state"
                label="State"
                defaultValue={(primaryAddress as any)?.state ?? ""}
              />
              <TextField
                id="zip"
                name="zip"
                label="Zip Code"
                defaultValue={(primaryAddress as any)?.zip ?? ""}
              />
              <TextField
                id="country"
                name="country"
                label="Country"
                defaultValue={(primaryAddress as any)?.country ?? "US"}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Notes
            </h2>
            <label
              htmlFor="notes"
              className="block mb-2 text-sm tracking-wide text-slate-700"
            >
              Internal Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={employee.notes ?? ""}
              className="block w-full rounded-md border p-3 text-sm text-slate-700 transition border-slate-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              to={`/dashboard/employees/${employee.id}`}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </fieldset>
      </Form>
    </>
  );
}

export function ErrorBoundary() {
  return <GlobalErrorBoundary />;
}
