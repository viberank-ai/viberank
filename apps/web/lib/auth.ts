export type User = { id: string; email: string };

export async function getUser(): Promise<User | null> {
  if (process.env.USE_MOCK_AUTH === '1') return { id: 'dev', email: 'dev@local' };
  const { currentUser } = await import('@clerk/nextjs/server');
  const user = await currentUser();
  if (!user) return null;
  return { id: user.id, email: user.emailAddresses?.[0]?.emailAddress ?? '' };
}
