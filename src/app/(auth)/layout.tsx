/* eslint-disable @next/next/no-img-element */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(160deg, #09090B 0%, #09090B 40%, #4A0820 75%, #D4175A 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-4">
          <img
            src="/logo-horizontal.png"
            alt="Creando Gigantes"
            style={{ width: "220px", height: "auto", objectFit: "contain" }}
          />
          <h1 className="text-white text-xl font-bold tracking-widest uppercase text-center">
            Intercambiador de Alimentos
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
