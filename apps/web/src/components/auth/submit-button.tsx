import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface SubmitButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const SubmitButton = React.forwardRef<
  HTMLButtonElement,
  SubmitButtonProps
>(
  (
    { loading = false, loadingText, children, className, disabled, ...props },
    ref,
  ) => (
    <Button
      ref={ref}
      type="submit"
      size="lg"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn("w-full", className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  ),
);
SubmitButton.displayName = "SubmitButton";
