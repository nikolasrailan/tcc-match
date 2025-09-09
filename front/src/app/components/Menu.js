"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { Button } from "@mui/material";
import { usePathname } from "next/navigation";

export default function Menu() {
  const [user, setUser] = useState(null);
  const { logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [pathname]);

  return (
    <ul className="menu">
      <li>
        <Link href="/">Home</Link>
      </li>
      {user?.isAdmin && (
        <li>
          <Link href="/usuarios">Admin Usuários</Link>
        </li>
      )}
      {user?.dadosAluno && (
        <li>
          <Link href="/aluno">Minhas Ideias</Link>
        </li>
      )}
      {user?.dadosProfessor && (
        <li>
          <Link href="/professor">Painel Professor</Link>
        </li>
      )}
      {user ? (
        <li>
          <Button
            onClick={logout}
            variant="outlined"
            size="small"
            sx={{ color: "var(--color-dark)" }}
          >
            Sair
          </Button>
        </li>
      ) : (
        <li>
          <Link href="/login">Login / Registrar</Link>
        </li>
      )}
    </ul>
  );
}
