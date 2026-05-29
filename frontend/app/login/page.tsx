import { Suspense } from "react";
import LoginForm from "./LoginForm";

function LoginFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-surface-container-low px-4 py-16">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-outline-variant" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
