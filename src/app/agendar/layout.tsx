import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agendamento Online | Studio Beauty',
  description: 'Agende seu horário online no Studio Beauty com praticidade e rapidez.',
};

export default function PublicAgendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start p-3 sm:p-6 antialiased selection:bg-accent selection:text-white">
      <div className="w-full max-w-md my-auto">
        {children}
      </div>
    </div>
  );
}
