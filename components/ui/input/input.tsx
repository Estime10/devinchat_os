"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ChangeEvent, type ComponentProps } from "react";

type InputProps = ComponentProps<"input">;

const fieldClassName =
  "min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 font-sans text-sm text-fg-default caret-fg-default outline-none placeholder:text-fg-dim";

/**
 * Variant password : type="password" → Eye (lucide) à droite du champ.
 * Vide → fluo adouci ; avec texte → fg-default.
 * Layout flex (pas absolute) pour que l’icône ne soit jamais masquée.
 */
export function Input({
  className = "",
  type = "text",
  onChange,
  value,
  defaultValue,
  ...props
}: InputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [uncontrolledHasValue, setUncontrolledHasValue] = useState(
    () => String(defaultValue ?? "").length > 0,
  );

  const isControlled = value !== undefined;
  const hasValue = isControlled
    ? String(value).length > 0
    : uncontrolledHasValue;

  const isPassword = type === "password";
  const resolvedType = isPassword && isVisible ? "text" : type;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setUncontrolledHasValue(event.target.value.length > 0);
    }
    onChange?.(event);
  };

  if (!isPassword) {
    return (
      <input
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={`w-full rounded-none border border-glass-border bg-transparent px-3 py-2.5 font-sans text-sm text-fg-default caret-fg-default outline-none placeholder:text-fg-dim focus:border-fg-default ${className}`.trim()}
        {...props}
      />
    );
  }

  const iconColorClass = hasValue ? "text-fg-default" : "text-fg-default/40";

  return (
    <div
      className={`relative z-0 flex w-full items-stretch rounded-none border border-glass-border focus-within:border-fg-default ${className}`.trim()}
    >
      <input
        type={resolvedType}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={fieldClassName}
        {...props}
      />
      <button
        type="button"
        onClick={() => {
          setIsVisible((current) => !current);
        }}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        className={`relative z-50 flex w-11 shrink-0 cursor-pointer items-center justify-center transition-colors hover:text-fg-default ${iconColorClass}`}
      >
        {isVisible ? (
          <EyeOff nonScalingStroke size={18} strokeWidth={1.75} />
        ) : (
          <Eye nonScalingStroke size={18} strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}
