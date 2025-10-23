"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getOrientacao, updateOrientacao } from "@/api/apiService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import OrientacaoCard from "../components/orientacao/OrientacaoCard";
import OrientacaoTabs from "../components/orientacao/OrientacaoTabs"; // Para professor com múltiplas ativas
import { Separator } from "@/components/ui/separator"; // Para separar ativas de inativas

export default function OrientacaoPage() {
  useAuthRedirect();

  const [allOrientacoes, setAllOrientacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedActiveIndex, setSelectedActiveIndex] = useState(0);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      // Determina userRole antes de buscar dados
      const storedUser = localStorage.getItem("user");
      let role = null;
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.dadosAluno) role = "aluno";
        if (parsedUser.dadosProfessor) role = "professor";
      }
      setUserRole(role); // Define o role no estado

      if (!role) {
        setLoading(false);
        setAllOrientacoes([]);
        return; // Sai se não for aluno nem professor
      }

      const data = await getOrientacao(); // API agora retorna todas
      setAllOrientacoes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(
        e.message || "Ocorreu um erro ao buscar os dados da orientação."
      );
      setAllOrientacoes([]);
    } finally {
      // Garante que setLoading só seja false após a primeira tentativa de busca
      if (loading) setLoading(false);
    }
  }, [loading]); // Adiciona loading como dependência para evitar loop inicial

  useEffect(() => {
    // Busca inicial
    setLoading(true);
    fetchData();
  }, []); // Executa apenas uma vez no mount

  // Filtra as orientações em ativas e inativas
  const { activeOrientations, inactiveOrientations } = useMemo(() => {
    const active = [];
    const inactive = [];
    const activeStatuses = ["em desenvolvimento", "pausado"];

    allOrientacoes.forEach((o) => {
      // Considera também se há solicitação de cancelamento pendente como "ativa" visualmente
      if (
        activeStatuses.includes(o.status) ||
        o.solicitacao_cancelamento !== "nenhuma"
      ) {
        active.push(o);
      } else {
        inactive.push(o);
      }
    });
    return { activeOrientations: active, inactiveOrientations: inactive };
  }, [allOrientacoes]);

  // Ajusta o índice selecionado se a lista de ativas mudar
  useEffect(() => {
    if (selectedActiveIndex >= activeOrientations.length) {
      setSelectedActiveIndex(Math.max(0, activeOrientations.length - 1));
    }
  }, [activeOrientations, selectedActiveIndex]);

  const handleUpdateDetails = async (id, data) => {
    setLoading(true); // Mostra loading durante a atualização
    try {
      await updateOrientacao(id, data);
      await fetchData(); // Rebusca TUDO para garantir consistência
    } catch (err) {
      setError(err.message || "Falha ao atualizar a orientação.");
    } finally {
      setLoading(false);
    }
  };

  // Função chamada após cancelamento (solicitado ou direto) ser bem sucedido
  const handleCancelSuccess = async () => {
    setLoading(true);
    await fetchData(); // Rebusca todas as orientações
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
            <p>Você precisa estar logado como aluno ou professor.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allOrientacoes.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Nenhuma Orientação</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você não possui nenhuma orientação (ativa ou encerrada).</p>
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

  // Garante que o índice ativo é válido
  const currentActiveOrientacao = activeOrientations[selectedActiveIndex];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">Minhas Orientações</h1>

      {/* Seção de Orientações Ativas */}
      {activeOrientations.length > 0 ? (
        <>
          {userRole === "professor" && activeOrientations.length > 1 ? (
            <>
              <OrientacaoTabs
                orientacoes={activeOrientations}
                selectedIndex={selectedActiveIndex}
                onSelect={setSelectedActiveIndex}
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
            // Aluno ou Professor com apenas uma ativa
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
        <Card className="max-w-md mx-auto border-dashed">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-normal text-muted-foreground">
              Nenhuma Orientação Ativa
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Seção de Orientações Inativas (Encerradas/Finalizadas) */}
      {inactiveOrientations.length > 0 && (
        <>
          {activeOrientations.length > 0 && <Separator className="my-8" />}{" "}
          {/* Separador visual */}
          <h2 className="text-2xl font-semibold text-center text-muted-foreground">
            Orientações Anteriores
          </h2>
          <div className="space-y-6">
            {inactiveOrientations.map((orientacao) => (
              <OrientacaoCard
                key={orientacao.id_orientacao}
                orientacao={orientacao}
                userRole={userRole}
                onUpdate={() => {}} // Não permite update em inativas
                onCancelSuccess={() => {}} // Não permite cancelamento em inativas
                isInactive={true} // Marca como inativa
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
