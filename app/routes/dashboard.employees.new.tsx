import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";

import Button from "~/components/Button";
import { GlobalErrorBoundary } from "~/components/GlobalErrorBoundary";
import SelectField from "~/components/SelectField";
import TextField from "~/components/TextField";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

export const meta: MetaFunction = () => [
  { title: "New Employee | Blevins HRIS" },
];

export async function loader() {
  const supabase = getSupabaseClient();
  const [{ data: departments }, { data: jobTitles }, { data: locations }, { data: managers }] =
    await Promise.all([
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("job_titles").select("id, title").order("title"),
      supabase.from("locations").select("id, name").order("name"),
      supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .order("last_name"),
    ]);

  return Response.json({
    departments: departments ?? [],
    jobTitles: jobTitles ?? [],
    locations: locations ?? [],
    managers: managers ?? [],
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const supabase = getSupabaseClient();

  const employeeData = {
    employee_number: "",
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
    status: "active" as const,
    department_id: (formData.get("department_id") as string) || null,
    job_title_id: (formData.get("job_title_id") as string) || null,
    location_id: (formData.get("location_id") as string) || null,
    manager_id: (formData.get("manager_id") as string) || null,
    pay_type: formData.get("pay_type") as string,
    salary: formData.get("salary") ? Number(formData.get("salary")) : null,
    hourly_rate: formData.get("hourly_rate")
      ? Number(formData.get("hourly_rate"))
      : null,
    notes: (formData.get("notes") as string) || null,
  };

  const { data: employee, error } = await supabase
    .from("employees")
    .insert([employeeData])
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const addressLine1 = formData.get("address_line1") as string;
  if (addressLine1) {
    await supabase.from("employee_addresses").insert([{
      employee_id: employee.id,
      address_type: "home",
      address_line1: addressLine1,
      address_line2: (formData.get("address_line2") as string) || null,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      country: (formData.get("country") as string) || "US",
      is_primary: true,
    }]);
  }

  const emergencyName = formData.get("emergency_name") as string;
  if (emergencyName) {
    await supabase.from("emergency_contacts").insert([{
      employee_id: employee.id,
      name: emergencyName,
      relationship: formData.get("emergency_relationship") as string,
      phone: formData.get("emergency_phone") as string,
      email: (formData.get("emergency_email") as string) || null,
      is_primary: true,
    }]);
  }

  return redirect(`/dashboard/employees/${employee.id}`);
}

export default function NewEmployee() {
  const { departments, jobTitles, locations, managers } =
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
          New Employee
        </h1>
        <Link
          to="/dashboard/employees"
          className="text-sm text-slate-500 hover:underline"
        >
          &larr; Back to employees
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
                placeholder="Jane"
              />
              <TextField
                id="last_name"
                name="last_name"
                label="Last Name"
                required
                placeholder="Smith"
              />
              <TextField
                id="preferred_name"
                name="preferred_name"
                label="Preferred Name"
                placeholder="(optional)"
              />
              <TextField
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                label="Date of Birth"
              />
              <TextField
                id="profile_photo_url"
                name="profile_photo_url"
                type="url"
                label="Profile Photo URL"
                placeholder="https://..."
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
              />
              <SelectField
                id="employment_type"
                name="employment_type"
                label="Employment Type"
                required
                defaultValue="full_time"
                options={employmentTypeOptions}
              />
              <SelectField
                id="department_id"
                name="department_id"
                label="Department"
                options={deptOptions}
              />
              <SelectField
                id="job_title_id"
                name="job_title_id"
                label="Job Title"
                options={titleOptions}
              />
              <SelectField
                id="location_id"
                name="location_id"
                label="Location"
                options={locationOptions}
              />
              <SelectField
                id="manager_id"
                name="manager_id"
                label="Reports To"
                options={managerOptions}
              />
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
                defaultValue="salary"
                options={payTypeOptions}
              />
              <TextField
                id="salary"
                name="salary"
                type="number"
                label="Annual Salary ($)"
                placeholder="75000"
              />
              <TextField
                id="hourly_rate"
                name="hourly_rate"
                type="number"
                label="Hourly Rate ($)"
                placeholder="25.00"
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
                placeholder="jane@company.com"
              />
              <TextField
                id="work_phone"
                name="work_phone"
                label="Work Phone"
                placeholder="+1 555 000 0000"
              />
              <TextField
                id="personal_email"
                name="personal_email"
                type="email"
                label="Personal Email"
                placeholder="jane@gmail.com"
              />
              <TextField
                id="personal_phone"
                name="personal_phone"
                label="Personal Phone"
                placeholder="+1 555 000 0001"
              />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Home Address
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField
                  id="address_line1"
                  name="address_line1"
                  label="Street Address"
                  placeholder="123 Main St"
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  id="address_line2"
                  name="address_line2"
                  label="Apt / Suite / Unit"
                  placeholder="Apt 4B"
                />
              </div>
              <TextField
                id="city"
                name="city"
                label="City"
                placeholder="Austin"
              />
              <TextField
                id="state"
                name="state"
                label="State"
                placeholder="TX"
              />
              <TextField
                id="zip"
                name="zip"
                label="Zip Code"
                placeholder="78701"
              />
              <TextField
                id="country"
                name="country"
                label="Country"
                defaultValue="US"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white shadow-md rounded-xl p-6 lg:p-8">
            <h2 className="text-base font-semibold text-slate-900 mb-6">
              Emergency Contact
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="emergency_name"
                name="emergency_name"
                label="Full Name"
                placeholder="John Smith"
              />
              <TextField
                id="emergency_relationship"
                name="emergency_relationship"
                label="Relationship"
                placeholder="Spouse"
              />
              <TextField
                id="emergency_phone"
                name="emergency_phone"
                label="Phone"
                placeholder="+1 555 000 0000"
              />
              <TextField
                id="emergency_email"
                name="emergency_email"
                type="email"
                label="Email"
                placeholder="john@gmail.com"
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
              className="block w-full rounded-md border p-3 text-sm text-slate-700 transition border-slate-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none resize-none"
              placeholder="Any additional notes about this employee..."
            />
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button to="/dashboard/employees" variant="outlined">
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create Employee
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
