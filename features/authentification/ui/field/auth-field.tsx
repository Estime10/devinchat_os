import { Input } from "@/components/ui/input/input";

type AuthFieldProps = {
  label: string;
  name: string;
  type: "email" | "text" | "password";
  autoComplete: string;
  placeholder: string;
};

export function AuthField({
  label,
  name,
  type,
  autoComplete,
  placeholder,
}: AuthFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-xs tracking-widest text-fg-muted uppercase">
        {label}
      </span>
      <Input
        type={type}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
    </label>
  );
}
