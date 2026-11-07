import { controlClass } from "@/components/ui/styles";

export function TextField({
  id,
  label,
  name,
  type = "text",
  autoComplete,
  inputMode,
  required = false,
  defaultValue,
  value,
  onChange,
  describedBy,
  invalid = false,
  errors,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  describedBy?: string;
  invalid?: boolean;
  errors?: string[];
}) {
  const errorId = `${id}-error`;
  const messages = errors ?? [];
  const description = [messages.length > 0 ? errorId : null, describedBy].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        {...(value === undefined ? { defaultValue } : { value })}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        aria-invalid={messages.length > 0 || invalid ? true : undefined}
        aria-describedby={description.length > 0 ? description : undefined}
        className={controlClass}
      />
      {messages.length > 0 ? (
        <ul id={errorId} className="text-sm text-amber-800 dark:text-amber-100">
          {messages.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
