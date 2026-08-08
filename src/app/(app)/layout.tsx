import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-md px-4 py-4 pb-24">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
