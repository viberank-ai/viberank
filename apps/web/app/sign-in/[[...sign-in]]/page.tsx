import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  if (process.env.USE_MOCK_AUTH === '1') {
    return <div className="min-h-[60vh] grid place-items-center">Mock Auth: Already signed in</div>;
  }
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
