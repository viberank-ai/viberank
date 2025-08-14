import './globals.css';

export const metadata = { title: 'VibeRank', description: 'Generative Search Optimization' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}