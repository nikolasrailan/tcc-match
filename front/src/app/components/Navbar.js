// front/src/app/components/Navbar.js
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const { logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // Função para atualizar o usuário do localStorage
    const updateUserFromStorage = () => {
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            setUser(null);
            logout(); // Faz logout se o usuário for inválido
          }
        } else {
          setUser(null);
        }
      }
    };

    updateUserFromStorage(); // Executa na montagem inicial e mudança de rota

    // Adiciona um listener para o evento storage para atualizar se o localStorage mudar em outra aba
    window.addEventListener("storage", updateUserFromStorage);

    // Cleanup listener
    return () => {
      window.removeEventListener("storage", updateUserFromStorage);
    };
  }, [pathname, logout]); // Adiciona logout como dependência

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="flex justify-between items-center p-1 px-3 border-b">
      <Link href="/" className="text-xl font-bold">
        TCC Match
      </Link>
      <nav className="flex items-center gap-1 flex-wrap justify-center">
        {" "}
        {/* Adicionado flex-wrap e justify-center */}
        <Link href="/" className={cn(navigationMenuTriggerStyle())}>
          Home
        </Link>
        {user?.dadosAluno && (
          <Link href="/aluno" className={cn(navigationMenuTriggerStyle())}>
            Minhas Ideias
          </Link>
        )}
        {user?.dadosProfessor && (
          <Link href="/professor" className={cn(navigationMenuTriggerStyle())}>
            Painel Professor
          </Link>
        )}
        {user?.dadosProfessor && ( // Adiciona link para professor
          <Link href="/reunioes" className={cn(navigationMenuTriggerStyle())}>
            Reuniões
          </Link>
        )}
        {(user?.dadosAluno || user?.dadosProfessor) && (
          <Link href="/orientacao" className={cn(navigationMenuTriggerStyle())}>
            Orientação
          </Link>
        )}
        {!!user?.isAdmin && (
          <>
            <Link href="/usuarios" className={cn(navigationMenuTriggerStyle())}>
              Usuários
            </Link>
            <Link href="/cursos" className={cn(navigationMenuTriggerStyle())}>
              Cursos
            </Link>
            <Link
              href="/areas-interesse"
              className={cn(navigationMenuTriggerStyle())}
            >
              Áreas
            </Link>
            {/* Link para a nova página de Bancas */}
            <Link
              href="/admin/bancas"
              className={cn(navigationMenuTriggerStyle())}
            >
              Bancas
            </Link>
          </>
        )}
        {user?.dadosAluno && (
          <Link
            href="/professores"
            className={cn(navigationMenuTriggerStyle())}
          >
            Professores
          </Link>
        )}
        {user?.dadosAluno && (
          <Link
            href="/solicitar-orientacao"
            className={cn(navigationMenuTriggerStyle())}
          >
            Solicitar Orientação
          </Link>
        )}
      </nav>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.nome}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil">Ver Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        pathname !== "/login" && ( // Não mostra o botão de Login na própria página de login
          <Button asChild size="sm">
            <Link href="/login">Login</Link>
          </Button>
        )
      )}
    </header>
  );
}
