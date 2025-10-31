"use client";
import React from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import BancaAdmin from "@/app/components/admin/bancas/BancaAdmin"; // O caminho correto para o componente

export default function AdminBancasPage() {
  useAuthRedirect(); // Protege a rota

  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user.isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Erro ao parsear usuário do localStorage", error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Verificando permissões...</div>;
  }

  if (!isAdmin) {
    return (
      <div>Acesso negado. Apenas administradores podem ver esta página.</div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Bancas</h1>
      <BancaAdmin />
    </div>
  );
}
