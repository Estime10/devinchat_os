import type { ComponentProps } from "react";

type ButtonVariant = "default" | "link" | "toolbar" | "bare";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default:
    "cursor-pointer rounded-none border border-fg-default bg-fg-default/15 px-5 py-2.5 font-sans text-sm font-semibold tracking-wide text-fg-default uppercase transition-colors hover:bg-fg-default/25 disabled:cursor-not-allowed disabled:opacity-50",
  link: "inline-flex cursor-pointer items-center font-sans text-sm leading-none tracking-tight text-fg-muted uppercase transition-colors hover:text-fg-default disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-fg-muted",
  toolbar: "note-editor-toolbar-btn",
  bare: "",
};

/**
 * Bouton design system — variants pour CTA, liens actions, toolbar notes.
 */
export function Button({
  className = "",
  type = "button",
  variant = "default",
  children,
  ...props
}: ButtonProps) {
  const variantClass = VARIANT_CLASS[variant];
  return (
    <button
      type={type}
      className={`${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
