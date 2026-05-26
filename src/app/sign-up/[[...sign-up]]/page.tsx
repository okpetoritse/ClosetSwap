import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </main>
  );
}