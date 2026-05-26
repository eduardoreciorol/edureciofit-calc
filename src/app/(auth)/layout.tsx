import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(160deg, #09090B 0%, #09090B 40%, #4A0820 75%, #D4175A 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Vertical logo */}
        <div className="mb-10 flex justify-center">
          <Image
            src="/logo-vertical.png"
            alt="Creando Gigantes"
            width={180}
            height={180}
            priority
            className="object-contain drop-shadow-[0_4px_24px_rgba(212,23,90,0.35)]"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
