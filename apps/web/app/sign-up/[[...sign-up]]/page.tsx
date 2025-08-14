import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  if (process.env.USE_MOCK_AUTH === '1') {
    return (
      <div className="min-h-[60vh] grid place-items-center">Mock Auth: Sign up not needed</div>
    );
  }
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
