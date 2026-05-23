# edureciofit — Calculadora de Equivalencias

PWA de equivalencias alimentarias para clientes de fitness. Next.js 15 + Supabase + TypeScript strict.

## Comandos

```bash
pnpm dev              # Servidor de desarrollo en localhost:3000
pnpm build            # Build de producción
pnpm lint             # ESLint
pnpm dlx prisma db push     # Sincronizar schema con Supabase
pnpm dlx prisma generate    # Regenerar tipos tras cambiar schema
```

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · Supabase (Postgres + Auth) · Prisma · Resend · Vercel

## Estructura

```
src/app/(auth)/         Login + invite (públicas)
src/app/(app)/          swap, receta (auth: client+)
src/app/(admin)/        panel admin (auth: role=admin)
src/app/api/            API routes
src/components/swap/    Food Swap UI
src/components/receta/  Recipe Swap UI
src/components/admin/   Admin UI
src/lib/equivalencias/algorithm.ts   ← Núcleo del algoritmo
src/lib/supabase/       Clientes browser/server/admin
src/lib/email/          Resend + React Email templates
src/lib/prisma.ts       Singleton Prisma client
```

## Variables de entorno necesarias

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Supabase Postgres (pooler) |
| `DIRECT_URL` | Supabase Postgres (direct) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (solo backend) |
| `RESEND_API_KEY` | API key Resend |
| `RESEND_FROM_EMAIL` | noreply@edureciofit.com |
| `NEXT_PUBLIC_APP_URL` | URL de la app |

## Reglas No Negociables

1. **TypeScript strict** — Prohibido `any`, `as any`, `@ts-ignore`
2. **Algoritmo en `src/lib/equivalencias/algorithm.ts`** — nunca duplicar lógica de macros
3. **`dominant_macro` se calcula SIEMPRE en el servidor** — nunca confiar en el cliente
4. **Mobile-first** — todo funciona en 375px primero
5. **Sin light mode** — app siempre dark
6. **Zod en todas las API routes** antes de tocar la DB
7. **`SUPABASE_SERVICE_ROLE_KEY` solo en `src/lib/supabase/admin.ts`**
8. **Soft delete en alimentos** — `is_active = false`, nunca DELETE físico

## Design Tokens

```
--primary: #3B82F6 (azul — botones, hidratos)
--accent: #EC4899  (rosa — proteína)
--warning: #F59E0B (ámbar — grasa)
--success: #22C55E (verde — ok)
--background: #09090B
--surface: #18181B (cards)
--surface-2: #27272A (bordes)
--text: #FAFAFA
--text-muted: #A1A1AA
```
