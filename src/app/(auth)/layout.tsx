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
        {/* Vertical logo — grande y centrado */}
        <div className="mb-10 flex justify-center">
          <img
            src="/logo-vertical.png"
            alt="Creando Gigantes"
            style={{
              width: "260px",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 4px 32px rgba(212,23,90,0.5))",
            }}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
