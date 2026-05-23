import { BottomNav } from "@/components/shared/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 w-full max-w-[480px] mx-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
