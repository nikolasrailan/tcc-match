"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getOrientacao, updateOrientacao } from "@/api/apiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import OrientacaoCard from "../components/orientacao/OrientacaoCard";
import OrientacaoTabs from "../components/orientacao/OrientacaoTabs";

export default function OrientacaoPage() {
  useAuthRedirect();

  const [orientacoes, setOrientacoes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.dadosAluno) setUserRole("aluno");
        if (parsedUser.dadosProfessor) setUserRole("professor");
      }

      const data = await getOrientacao();
      setOrientacoes(data);
    } catch (e) {
      setError(
        e.message || "Ocorreu um erro ao buscar os dados da orientação."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (id, data) => {
    try {
      await updateOrientacao(id, data);
      fetchData(); // Re-fetch data to show updated info
    } catch (err) {
      setError(err.message || "Falha ao atualizar a orientação.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        <p>Erro: {error}</p>
      </div>
    );
  }

  if (!orientacoes || orientacoes.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Nenhuma Orientação</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você ainda não possui uma orientação em andamento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">Minhas Orientações</h1>

      {userRole === "professor" && orientacoes && orientacoes.length > 1 ? (
        <>
          <OrientacaoTabs
            orientacoes={orientacoes}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
          {orientacoes[selectedIndex] && (
            <OrientacaoCard
              orientacao={orientacoes[selectedIndex]}
              userRole={userRole}
              onUpdate={handleUpdate}
            />
          )}
        </>
      ) : (
        orientacoes.map((orientacao) => (
          <OrientacaoCard
            key={orientacao.id_orientacao}
            orientacao={orientacao}
            userRole={userRole}
            onUpdate={handleUpdate}
          />
        ))
      )}
    </div>
  );
}
