"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getOrientacao, updateOrientacao } from "@/api/apiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import OrientacaoCard from "../components/orientacao/OrientacaoCard";
import OrientacaoTabs from "../components/orientacao/OrientacaoTabs"; // Para professor com múltiplas ativas
import { Separator } from "@/components/ui/separator"; // Para separar ativas de inativas

export default function OrientacaoPage() {
  useAuthRedirect();

  const [orientacoesAtivas, setOrientacoesAtivas] = useState([]);
  const [orientacoesInativas, setOrientacoesInativas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedAtivaIndex, setSelectedAtivaIndex] = useState(0);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      let role = null;
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.dadosAluno) role = "aluno";
        if (parsedUser.dadosProfessor) role = "professor";
        setUserRole(role);
      } else {
        setLoading(false);
        setOrientacoesAtivas([]);
        setOrientacoesInativas([]);
        return;
      }

      const todasOrientacoes = await getOrientacao();
      const ativas = [];
      const inativas = [];

      if (Array.isArray(todasOrientacoes)) {
        todasOrientacoes.forEach((o) => {
          if (["encerrado", "cancelado"].includes(o.status)) {
            inativas.push(o);
          } else {
            // Inclui 'em desenvolvimento', 'pausado', 'finalizado' e solicitações pendentes
            ativas.push(o);
          }
        });
      }

      setOrientacoesAtivas(ativas);
      setOrientacoesInativas(inativas);

      // Ajusta o índice selecionado se ele ficar inválido após a atualização
      if (selectedAtivaIndex >= ativas.length) {
        setSelectedAtivaIndex(0);
      }
    } catch (e) {
      setError(
        e.message || "Ocorreu um erro ao buscar os dados da orientação."
      );
      setOrientacoesAtivas([]);
      setOrientacoesInativas([]);
    } finally {
      // Garante que setLoading(false) só seja chamado uma vez no final
      if (loading) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAtivaIndex]); // Remove 'loading' das dependências para evitar loop

  useEffect(() => {
    setLoading(true); // Define loading como true no início do carregamento
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas na montagem inicial

  const handleUpdateDetails = async (id, data) => {
    setLoading(true);
    try {
      await updateOrientacao(id, data);
      await fetchData(); // Recarrega os dados após a atualização
    } catch (err) {
      setError(err.message || "Falha ao atualizar a orientação.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSuccess = async () => {
    setLoading(true);
    await fetchData(); // Recarrega os dados após cancelamento/encerramento
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

  if (orientacoesAtivas.length === 0 && orientacoesInativas.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Nenhuma Orientação</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você não possui nenhuma orientação ativa ou anterior.</p>
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

  // Garante que selectedAtivaIndex é válido para orientações ativas
  const currentActiveIndex = Math.max(
    0,
    Math.min(selectedAtivaIndex, orientacoesAtivas.length - 1)
  );
  const currentActiveOrientacao = orientacoesAtivas[currentActiveIndex];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">Minhas Orientações</h1>

      {/* Seção de Orientações Ativas */}
      {orientacoesAtivas.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold text-center text-primary">
            Orientações Ativas
          </h2>
          {userRole === "professor" && orientacoesAtivas.length > 1 ? (
            <>
              <OrientacaoTabs
                orientacoes={orientacoesAtivas}
                selectedIndex={currentActiveIndex}
                onSelect={setSelectedAtivaIndex}
              />
              {currentActiveOrientacao && (
                <OrientacaoCard
                  key={currentActiveOrientacao.id_orientacao}
                  orientacao={currentActiveOrientacao}
                  userRole={userRole}
                  onUpdate={handleUpdateDetails}
                  onCancelSuccess={handleCancelSuccess}
                />
              )}
            </>
          ) : (
            currentActiveOrientacao && (
              <OrientacaoCard
                key={currentActiveOrientacao.id_orientacao}
                orientacao={currentActiveOrientacao}
                userRole={userRole}
                onUpdate={handleUpdateDetails}
                onCancelSuccess={handleCancelSuccess}
              />
            )
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground">
          Nenhuma orientação ativa no momento.
        </p>
      )}

      {/* Separador e Seção de Orientações Anteriores */}
      {orientacoesInativas.length > 0 && (
        <>
          <Separator className="my-8" />
          <h2 className="text-xl font-semibold text-center text-muted-foreground">
            Orientações Anteriores
          </h2>
          <div className="space-y-6">
            {orientacoesInativas.map((orientacao) => (
              <OrientacaoCard
                key={orientacao.id_orientacao}
                orientacao={orientacao}
                userRole={userRole}
                onUpdate={handleUpdateDetails}
                onCancelSuccess={handleCancelSuccess} // Passa a função aqui também, caso necessário
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
