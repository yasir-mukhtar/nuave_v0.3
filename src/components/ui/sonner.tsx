"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      toastOptions={{ style: { width: "fit-content" } }}
      {...props}
    />
  );
}
