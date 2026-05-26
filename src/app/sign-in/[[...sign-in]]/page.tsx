import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  );
}