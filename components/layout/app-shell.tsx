import Link from "next/link";
import { Building2, LayoutGrid, PlusCircle } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
            <span>People Hub</span>
            <span className="text-sm font-normal text-muted-foreground">
              Gestão de Movimentações
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Dashboard
            </Link>
            <Link
              href="/movimentacoes/nova"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" aria-hidden />
              Nova Movimentação
            </Link>
          </nav>
        </div>
      </header>
      <main className="container flex-1 py-8">{children}</main>
    </div>
  );
}
