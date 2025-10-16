"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  return (
    <main>
      <div className="container mx-auto max-w-3xl">
        <div className="mt-5 text-center p-4 md:p-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Bem-vindo ao TCC Match
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            A plataforma para conectar alunos e professores para o trabalho de
            conclusão de curso.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {token ? (
              <p className="text-muted-foreground">
                Você já está logado. Navegue pelo menu.
              </p>
            ) : (
              <Button asChild size="lg">
                <Link href="/login">Entrar / Registrar</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
