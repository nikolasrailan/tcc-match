"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getProfessores,
  getMinhaIdeiaTcc,
  enviarSolicitacao,
  getMinhasSolicitacoes,
  cancelarSolicitacao,
  findProfessorMatch, // Importar a nova função
} from "@/api/apiService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ConfirmationDialog from "../components/reuniao/ConfirmacaoDialog";
import SelectIdeiaDialog from "../components/solicitacao/SelectIdeiaDialog"; // Importar componente
import MatchResultDialog from "../components/solicitacao/MatchResultDialog"; // Importar componente
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react"; // Importar Loader2 e Search

// --- Componente Principal da Página ---
export default function SolicitarOrientacaoPage() {
  useAuthRedirect();
  const [professores, setProfessores] = useState([]);
  const [ideias, setIdeias] = useState([]); // Ideias disponíveis (status 0)
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [selectedIdeia, setSelectedIdeia] = useState("");
  const [loading, setLoading] = useState(true); // Loading geral da página
  const [error, setError] = useState("");
  const [confirmationState, setConfirmationState] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Estados para os diálogos de Match
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isMatchResultDialogOpen, setIsMatchResultDialogOpen] = useState(false);
  const [selectedIdeiaForMatch, setSelectedIdeiaForMatch] = useState(null);
  const [matchedProfessor, setMatchedProfessor] = useState(null);
  const [isFindingMatch, setIsFindingMatch] = useState(false); // Loading específico do match

  const fetchData = useCallback(async () => {
    // Não seta loading aqui para evitar piscar na tela ao enviar solicitação ou cancelar
    const [profData, ideiasData, solicitacoesData] = await Promise.all([
      getProfessores(true), // Pega apenas professores disponíveis
      getMinhaIdeiaTcc(),
      getMinhasSolicitacoes(),
    ]);

    if (profData) {
      setProfessores(profData);
    }
    if (ideiasData) {
      // Filtra ideias com status 0 (disponíveis)
      const ideiasDisponiveis = ideiasData.filter(
        (ideia) => ideia.status === 0
      );
      setIdeias(ideiasDisponiveis);
    }
    if (solicitacoesData) {
      setSolicitacoes(solicitacoesData);
    }
    setLoading(false); // Seta loading false apenas após buscar todos os dados
  }, []);

  useEffect(() => {
    setLoading(true); // Seta loading true na montagem inicial
    fetchData();
  }, [fetchData]);

  // Handler para envio da solicitação normal (manual)
  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSendRequest(selectedProfessor, selectedIdeia);
  };

  // Handler genérico para enviar solicitação (usado pelo form manual e pelo dialog de match)
  const handleSendRequest = async (professorId, ideiaId) => {
    if (!professorId || !ideiaId) {
      const msg = "Por favor, selecione um professor e uma ideia.";
      setError(msg); // Define o erro para exibição (opcional)
      toast.error(msg);
      return; // Sai da função
    }

    setLoading(true); // Ativa loading geral
    setError(""); // Limpa erro anterior

    try {
      const result = await enviarSolicitacao({
        id_professor: professorId,
        id_ideia_tcc: ideiaId,
      });

      if (result) {
        toast.success("Solicitação enviada com sucesso!");
        setSelectedIdeia(""); // Limpa seleção do formulário principal
        setSelectedProfessor(""); // Limpa seleção do formulário principal
        setIsMatchResultDialogOpen(false); // Fecha o dialog de resultado (se aberto)
        setSelectedIdeiaForMatch(null); // Limpa ideia do match
        setMatchedProfessor(null); // Limpa professor do match
        fetchData(); // Atualiza a lista de solicitações e ideias disponíveis
      }
      // Se não houver 'result', o erro já foi tratado pela fetchApi e exibido pelo toast
    } catch (err) {
      // Erro já tratado e exibido pelo toast na fetchApi
      // Apenas garantimos que o erro seja limpo se necessário em futuras ações
      setError(err.message || "Erro desconhecido ao enviar solicitação.");
      toast.error("Erro ao enviar solicitação", {
        description: err.message || "Tente novamente.",
      }); // Garante que o toast seja mostrado
    } finally {
      setLoading(false); // Desativa loading geral
    }
  };

  // Handler para abrir o diálogo de cancelamento
  const handleOpenCancelModal = (solicitacao) => {
    setConfirmationState({
      open: true,
      title: "Confirmar Cancelamento",
      description: "Tem certeza que deseja cancelar esta solicitação?",
      confirmText: "Sim, cancelar",
      confirmVariant: "destructive",
      onConfirm: async () => {
        if (!solicitacao) return;

        setLoading(true); // Ativa loading geral
        try {
          const result = await cancelarSolicitacao(solicitacao.id_solicitacao);
          if (result) {
            toast.success("Solicitação cancelada com sucesso!");
            fetchData(); // Atualiza a lista
          }
          // Erros são tratados pelo fetchApi
        } catch (err) {
          toast.error(
            err.message || "Não foi possível cancelar a solicitação."
          );
        } finally {
          setLoading(false); // Desativa loading geral
          setConfirmationState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
          }); // Fecha o modal de confirmação
        }
      },
    });
  };

  // Handler para abrir o diálogo de seleção de ideia para Match
  const handleOpenMatchDialog = () => {
    setSelectedIdeiaForMatch(null); // Limpa seleção anterior
    setMatchedProfessor(null); // Limpa match anterior
    setIsMatchDialogOpen(true);
  };

  // Handler chamado pelo SelectIdeiaDialog para buscar o match
  const handleFindMatch = async (ideiaId) => {
    setIsFindingMatch(true); // Ativa loading específico do match
    setError(""); // Limpa erros anteriores
    try {
      const matchResult = await findProfessorMatch(ideiaId);
      if (matchResult) {
        setMatchedProfessor(matchResult);
        setSelectedIdeiaForMatch(ideiaId); // Guarda a ideia selecionada
        setIsMatchDialogOpen(false); // Fecha o diálogo de seleção
        setIsMatchResultDialogOpen(true); // Abre o diálogo de resultado
      }
      // Erro 404 (sem match) é tratado no catch
    } catch (err) {
      // Exibe a mensagem de erro específica retornada pela API
      toast.error("Não foi possível encontrar um match", {
        description:
          err.message || "Verifique as áreas da ideia ou tente mais tarde.",
      });
      // Mantém o diálogo de seleção aberto em caso de erro
    } finally {
      setIsFindingMatch(false); // Desativa loading específico
    }
  };

  // Função para obter o componente Badge do status
  const getStatusBadge = (status) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary">Pendente</Badge>;
      case 1:
        return <Badge>Aceito</Badge>;
      case 2:
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 3:
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Renderiza loading inicial
  if (loading && !solicitacoes.length && !professores.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Card Principal: Solicitar Orientação */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Solicitar Orientação</CardTitle>
              <CardDescription>
                Escolha uma ideia e um professor disponível ou use o Match.
              </CardDescription>
            </div>
            {/* Botão Encontrar Match */}
            <Button
              variant="outline"
              onClick={handleOpenMatchDialog}
              disabled={loading || isFindingMatch || ideias.length === 0} // Desabilita se estiver carregando ou buscando match ou sem ideias
            >
              <Search className="mr-2 h-4 w-4" />
              Encontrar Match
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-2">
              <Label>Professor Disponível</Label>
              <Select
                onValueChange={setSelectedProfessor}
                value={selectedProfessor}
                disabled={loading} // Desabilita durante o loading geral
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor..." />
                </SelectTrigger>
                <SelectContent>
                  {professores.length > 0 ? (
                    professores
                      .filter((prof) => prof.usuario) // Garante que tem dados de usuário
                      .map((prof) => (
                        <SelectItem
                          key={prof.id_professor}
                          value={prof.id_professor.toString()}
                          // Desabilita se o professor não tiver vagas
                          disabled={
                            prof.limite_orientacoes -
                              (prof.orientandos_atuais || 0) <=
                            0
                          }
                        >
                          {prof.usuario.nome} (Vagas:{" "}
                          {Math.max(
                            0,
                            prof.limite_orientacoes -
                              (prof.orientandos_atuais || 0)
                          )}
                          )
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="disabled" disabled>
                      Nenhum professor disponível encontrado.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minha Ideia de TCC (Disponível)</Label>
              <Select
                onValueChange={setSelectedIdeia}
                value={selectedIdeia}
                disabled={loading} // Desabilita durante o loading geral
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua ideia..." />
                </SelectTrigger>
                <SelectContent>
                  {ideias.length > 0 ? (
                    ideias.map((ideia) => (
                      <SelectItem
                        key={ideia.id_ideia_tcc}
                        value={ideia.id_ideia_tcc.toString()}
                      >
                        {ideia.titulo}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="disabled" disabled>
                      Você não tem ideias disponíveis para orientação.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={
                loading ||
                ideias.length === 0 ||
                !selectedProfessor ||
                !selectedIdeia
              } // Desabilita se carregando, sem ideias ou sem seleção
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitação Manual
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Card: Minhas Solicitações */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Minhas Solicitações</CardTitle>
          <CardDescription>
            Acompanhe o status das suas solicitações de orientação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Ideia de TCC</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.length > 0 ? (
                solicitacoes.map((solicitacao) => (
                  <TableRow key={solicitacao.id_solicitacao}>
                    <TableCell className="font-medium">
                      {solicitacao.professor?.usuario?.nome || "N/A"}
                    </TableCell>
                    <TableCell>
                      {solicitacao.ideiaTcc?.titulo || "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        solicitacao.data_solicitacao
                      ).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
                    <TableCell className="text-right">
                      {solicitacao.status === 0 && ( // Apenas pendentes podem ser canceladas
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenCancelModal(solicitacao)}
                          disabled={loading} // Desabilita durante o loading geral
                        >
                          Cancelar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Você ainda não enviou nenhuma solicitação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Cancelamento */}
      <ConfirmationDialog
        open={confirmationState.open}
        onOpenChange={
          (isOpen) =>
            !isOpen &&
            setConfirmationState({
              open: false,
              title: "",
              description: "",
              onConfirm: () => {},
            }) // Reset state on close
        }
        title={confirmationState.title}
        description={confirmationState.description}
        onConfirm={confirmationState.onConfirm}
        confirmText={confirmationState.confirmText || "Confirmar"} // Default confirm text
        confirmVariant={confirmationState.confirmVariant} // Pass variant if needed
      />

      {/* Diálogo para Selecionar Ideia (Match) */}
      <SelectIdeiaDialog
        open={isMatchDialogOpen}
        onClose={() => setIsMatchDialogOpen(false)}
        ideias={ideias} // Passa apenas ideias disponíveis
        onFindMatch={handleFindMatch}
      />

      {/* Diálogo para Mostrar Resultado do Match */}
      <MatchResultDialog
        open={isMatchResultDialogOpen}
        onClose={() => setIsMatchResultDialogOpen(false)}
        professor={matchedProfessor}
        ideiaId={selectedIdeiaForMatch}
        onSendRequest={handleSendRequest} // Reutiliza o handler geral
      />
    </div>
  );
}
