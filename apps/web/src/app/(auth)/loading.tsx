import { AuthCard } from "@/components/auth";

export default function AuthLoading() {
  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-2/5 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="space-y-4">
          {[0, 1].map((row) => (
            <div key={row} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </AuthCard>
  );
}
