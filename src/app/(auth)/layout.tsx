export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#FAFAFA]">
            <span className="text-[#3B82F6]">edu</span>reciofit
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Calculadora de Equivalencias</p>
        </div>
        {children}
      </div>
    </div>
  );
}
