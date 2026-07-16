import type { ReactNode } from "react";

interface AlertProps {
  variant?: "danger" | "success";
  children: ReactNode;
}

export function Alert({ variant = "danger", children }: AlertProps) {
  const variants = {
    danger: "bg-danger-surface text-danger",
    success: "bg-success-surface text-success",
  };

  return (
    <div role="alert" className={`rounded-md px-4 py-3 text-sm font-medium ${variants[variant]}`}>
      {children}
    </div>
  );
}
