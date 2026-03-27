"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:!bg-green-50 group-[.toast]:!text-green-800 group-[.toast]:!border-green-200",
          error: "group-[.toast]:!bg-red-50 group-[.toast]:!text-red-800 group-[.toast]:!border-red-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }