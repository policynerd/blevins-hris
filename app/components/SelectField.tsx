type Option = { value: string; label: string };

type Props = {
  id: string;
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
};

export default function SelectField({
  id,
  name,
  label,
  options,
  defaultValue,
  required,
  placeholder,
}: Props) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-2 text-sm tracking-wide text-slate-700"
      >
        {label}{" "}
        {required && (
          <span
            title="This field is required"
            aria-label="required"
            className="text-cyan-600"
          >
            *
          </span>
        )}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="block w-full rounded-md border p-3 text-sm text-slate-700 bg-white transition border-slate-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
