import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button">;

export function Button({
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`cursor-pointer rounded-none border border-fg-default bg-fg-default/15 px-5 py-2.5 font-sans text-sm font-semibold tracking-wide text-fg-default uppercase transition-colors hover:bg-fg-default/25 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
