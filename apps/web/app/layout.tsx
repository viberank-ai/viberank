import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import TopNav from '../components/TopNav';

const Provider =
  process.env.USE_MOCK_AUTH === '1'
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : ClerkProvider;

export const metadata = { title: 'VibeRank', description: 'Generative Search Optimization' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <Provider>
          <TopNav />
          <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
        </Provider>
      </body>
    </html>
  );
}
