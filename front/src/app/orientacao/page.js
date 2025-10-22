"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getOrientacao, updateOrientacao } from "@/api/apiService"; // updateOrientacao original é mantida para detalhes
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import OrientacaoCard from "../components/orientacao/OrientacaoCard";
import OrientacaoTabs from "../components/orientacao/OrientacaoTabs";

export default function OrientacaoPage() {
  useAuthRedirect();

  const [orientacoes, setOrientacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.dadosAluno) setUserRole("aluno");
        if (parsedUser.dadosProfessor) setUserRole("professor");
      } else {
        setLoading(false);
        setOrientacoes([]);
        return;
      }

      const data = await getOrientacao();
      setOrientacoes(Array.isArray(data) ? data : []);
      if (selectedIndex >= (data?.length || 0)) {
        setSelectedIndex(0);
      }
    } catch (e) {
      setError(
        e.message || "Ocorreu um erro ao buscar os dados da orientação."
      );
      setOrientacoes([]);
    } finally {
      if (loading) setLoading(false);
    }
  }, [selectedIndex, loading]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  // Função para atualizar detalhes gerais (passada para OrientacaoCard)
  const handleUpdateDetails = async (id, data) => {
    setLoading(true); // Mostra loading durante a atualização
    try {
      await updateOrientacao(id, data);
      await fetchData();
    } catch (err) {
      setError(err.message || "Falha ao atualizar a orientação.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSuccess = async () => {
    setLoading(true);
    await fetchData();
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

  if (!userRole) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Você precisa estar logado como aluno ou professor para ver esta
              página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orientacoes.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Nenhuma Orientação Ativa</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você não possui nenhuma orientação em andamento no momento.</p>
            {userRole === "aluno" && (
              <p className="mt-2 text-sm text-muted-foreground">
                Você pode solicitar uma na página "Solicitar Orientação".
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Garante que selectedIndex é válido
  const currentSelectedIndex = Math.min(selectedIndex, orientacoes.length - 1);
  const currentOrientacao = orientacoes[currentSelectedIndex];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">Minhas Orientações</h1>

      {userRole === "professor" && orientacoes.length > 1 ? (
        <>
          <OrientacaoTabs
            orientacoes={orientacoes}
            selectedIndex={currentSelectedIndex}
            onSelect={setSelectedIndex}
          />
          {/* Renderiza apenas se currentOrientacao existir */}
          {currentOrientacao && (
            <OrientacaoCard
              key={currentOrientacao.id_orientacao}
              orientacao={currentOrientacao}
              userRole={userRole}
              onUpdate={handleUpdateDetails}
              onCancelSuccess={handleCancelSuccess}
            />
          )}
        </>
      ) : (
        // Se for aluno ou professor com apenas uma orientação
        // Renderiza apenas se a orientação existir
        currentOrientacao && (
          <OrientacaoCard
            key={currentOrientacao.id_orientacao}
            orientacao={currentOrientacao}
            userRole={userRole}
            onUpdate={handleUpdateDetails}
            onCancelSuccess={handleCancelSuccess}
          />
        )
      )}
    </div>
  );
}
