"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  getReunioes,
  atualizarReuniao,
  getTopicos,
  solicitarCancelamentoOrientacao,
  confirmarCancelamentoOrientacao,
  cancelarOrientacaoDiretoProfessor,
  finalizarOrientacao,
  solicitarFinalizacaoOrientacao,
  confirmarFinalizacaoOrientacao,
} from "@/api/apiService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  Ban,
  MessageSquareWarning,
  Loader2,
  CheckCircle,
  CheckCheck, // Novo ícone para solicitar finalização
} from "lucide-react";
import ConfirmationDialog from "../reuniao/ConfirmacaoDialog"; // Correct import for the confirmation dialog
import ReuniaoModal from "../reuniao/ReuniaoModal";
import TopicosDialog from "../topico/TopicoDialog";
import ReunioesSection from "../reuniao/ReuniaoSecao";
import TopicosSection from "../topico/TopicosSecao";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const OrientacaoCard = ({
  orientacao,
  userRole,
  onUpdate,
  onActionSuccess, // Renomeado de onCancelSuccess para clareza
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [reunioes, setReunioes] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [reuniaoModalState, setReuniaoModalState] = useState({
    open: false,
    initialData: null,
  });
  const [topicosModalOpen, setTopicosModalOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackActionType, setFeedbackActionType] = useState(null); // 'cancel', 'finalize', 'confirm-finalize'
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [formData, setFormData] = useState({
    url_projeto: orientacao.url_projeto || "",
    observacoes: orientacao.observacoes || "",
  });

  // Atualiza o estado local quando a prop 'orientacao' mudar
  useEffect(() => {
    setFormData({
      url_projeto: orientacao.url_projeto || "",
      observacoes: orientacao.observacoes || "",
    });
    // Reseta estados relacionados a ações ao mudar a orientação
    setIsEditing(false);
    setFeedbackText("");
    setFeedbackActionType(null);
    setIsSubmittingAction(false);
  }, [orientacao]);

  // Busca reuniões e tópicos associados à orientação
  const fetchReunioes = useCallback(async () => {
    if (orientacao.id_orientacao) {
      const data = await getReunioes(orientacao.id_orientacao);
      // Ordena reuniões: marcadas primeiro, depois por data decrescente
      if (data) {
        data.sort((a, b) => {
          if (a.status === "marcada" && b.status !== "marcada") return -1;
          if (a.status !== "marcada" && b.status === "marcada") return 1;
          return new Date(b.data_horario) - new Date(a.data_horario);
        });
        setReunioes(data);
      }
    }
  }, [orientacao.id_orientacao]);

  const fetchTopicos = useCallback(async () => {
    if (orientacao.id_orientacao) {
      const data = await getTopicos(orientacao.id_orientacao);
      if (data) setTopicos(data);
    }
  }, [orientacao.id_orientacao]);

  // Busca dados de reuniões e tópicos quando a orientação muda
  useEffect(() => {
    fetchReunioes();
    fetchTopicos();
  }, [fetchReunioes, fetchTopicos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateDetails = () => {
    onUpdate(orientacao.id_orientacao, formData); // Chama a função passada via props
    setIsEditing(false); // Fecha o modo de edição
  };

  // --- Handlers para Modais de Reunião ---
  const handleOpenCreateModal = () =>
    setReuniaoModalState({ open: true, initialData: null });
  const handleOpenEditModal = (reuniao) =>
    setReuniaoModalState({ open: true, initialData: reuniao });
  const handleCloseReuniaoModal = () =>
    setReuniaoModalState({ open: false, initialData: null });

  // Handler para mudança de status de reunião (com confirmação)
  const handleReuniaoStatusChange = (reuniaoId, status) => {
    const actionText =
      status === "realizada" ? "marcar como realizada" : "cancelar";
    setConfirmationState({
      open: true,
      title: `Confirmar Ação`,
      description: `Tem certeza que deseja ${actionText} esta reunião?`,
      onConfirm: async () => {
        setIsSubmittingAction(true); // Ativa loading específico da ação
        try {
          await atualizarReuniao(reuniaoId, { status });
          toast.success(
            `Reunião ${
              status === "realizada" ? "marcada como realizada" : "cancelada"
            }.`
          );
          fetchReunioes(); // Atualiza a lista de reuniões
        } catch (error) {
          toast.error(`Erro ao ${actionText} reunião: ${error.message}`);
        } finally {
          setIsSubmittingAction(false); // Desativa loading da ação
          // Fecha e reseta o modal de confirmação
          setConfirmationState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
          });
        }
      },
    });
  };

  // --- Funções de Ações da Orientação (Finalizar/Cancelar) ---

  // Aluno solicita finalização
  const handleSolicitarFinalizacao = () => {
    setConfirmationState({
      open: true,
      title: "Solicitar Finalização",
      description:
        "Tem certeza que deseja solicitar a finalização desta orientação? O professor precisará confirmar.",
      onConfirm: async () => {
        setIsSubmittingAction(true);
        try {
          const result = await solicitarFinalizacaoOrientacao(
            orientacao.id_orientacao
          );
          toast.success(
            result.message || "Solicitação de finalização enviada."
          );
          onActionSuccess(); // Atualiza a página de orientações
        } catch (error) {
          toast.error(`Erro ao solicitar finalização: ${error.message}`);
        } finally {
          setIsSubmittingAction(false);
          // Fecha e reseta o modal de confirmação
          setConfirmationState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
          });
        }
      },
    });
  };

  // Professor abre modal para confirmar finalização solicitada pelo aluno
  const handleOpenConfirmarFinalizacaoModal = () => {
    setFeedbackText(""); // Limpa feedback anterior
    setFeedbackActionType("confirm-finalize"); // Define o tipo de ação
    setFeedbackModalOpen(true); // Abre o modal de feedback
  };

  // Aluno solicita cancelamento
  const handleSolicitarCancelamento = () => {
    setConfirmationState({
      open: true,
      title: "Solicitar Cancelamento",
      description:
        "Tem certeza que deseja solicitar o cancelamento desta orientação? O professor precisará confirmar.",
      onConfirm: async () => {
        setIsSubmittingAction(true);
        try {
          const result = await solicitarCancelamentoOrientacao(
            orientacao.id_orientacao
          );
          toast.success(
            result.message || "Solicitação de cancelamento enviada."
          );
          onActionSuccess(); // Atualiza a página de orientações
        } catch (error) {
          toast.error(`Erro ao solicitar cancelamento: ${error.message}`);
        } finally {
          setIsSubmittingAction(false);
          // Fecha e reseta o modal de confirmação
          setConfirmationState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
          });
        }
      },
    });
  };

  // Professor abre modal para confirmar cancelamento solicitado pelo aluno
  const handleOpenConfirmarCancelamentoModal = () => {
    setFeedbackText("");
    setFeedbackActionType("cancel"); // Reutiliza 'cancel' para confirmação
    setFeedbackModalOpen(true);
  };

  // Professor abre modal para cancelar diretamente (sem solicitação do aluno)
  const handleCancelarDireto = () => {
    setFeedbackText("");
    setFeedbackActionType("cancel"); // Reutiliza 'cancel' para cancelamento direto
    setFeedbackModalOpen(true);
  };

  // Professor abre modal para finalizar diretamente (sem solicitação do aluno)
  const handleOpenFinalizarOrientacaoModal = () => {
    setFeedbackText("");
    setFeedbackActionType("finalize");
    setFeedbackModalOpen(true);
  };

  // Submete o feedback (e a ação correspondente) do modal de feedback
  const handleFeedbackSubmit = async () => {
    setIsSubmittingAction(true);
    try {
      let result;
      let successMessage = "";
      let actionVerb = "";

      if (feedbackActionType === "finalize") {
        actionVerb = "finalizar";
        result = await finalizarOrientacao(orientacao.id_orientacao, {
          // Nota: A API espera o feedback no body, mesmo que a rota não use
          // Isso pode precisar de ajuste na API se ela não consumir o body aqui
        });
        successMessage = result.message || "Orientação finalizada com sucesso!";
      } else if (feedbackActionType === "confirm-finalize") {
        actionVerb = "finalizar";
        result = await confirmarFinalizacaoOrientacao(
          orientacao.id_orientacao,
          feedbackText // Envia o feedback
        );
        successMessage = result.message || "Orientação finalizada com sucesso!";
      } else if (feedbackActionType === "cancel") {
        actionVerb = "encerrar";
        if (orientacao.solicitacao_cancelamento === "aluno") {
          result = await confirmarCancelamentoOrientacao(
            orientacao.id_orientacao,
            feedbackText
          );
          successMessage =
            result.message || "Orientação encerrada com sucesso.";
        } else {
          result = await cancelarOrientacaoDiretoProfessor(
            orientacao.id_orientacao,
            feedbackText
          );
          successMessage =
            result.message || "Orientação encerrada pelo professor.";
        }
      }

      toast.success(successMessage);
      setFeedbackModalOpen(false); // Fecha o modal de feedback
      onActionSuccess(); // Atualiza a página de orientações
    } catch (error) {
      const actionText = feedbackActionType?.includes("finalize") // Add safe check
        ? "finalizar"
        : "encerrar";
      toast.error(`Erro ao ${actionText} orientação: ${error.message}`);
    } finally {
      setIsSubmittingAction(false); // Desativa loading da ação
    }
  };

  // ------------------------------

  // Conta tópicos não lidos pelo professor
  const newTopicsCount =
    userRole === "professor"
      ? topicos.filter((t) => t.status === "enviado").length
      : 0;

  // Renderiza o badge de status da orientação
  const renderStatusBadge = (
    status,
    solicitacaoCancelamento,
    solicitacaoFinalizacao
  ) => {
    // Prioriza exibir solicitações pendentes
    if (solicitacaoFinalizacao === "aluno") {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          Finalização Solicitada (Aluno)
        </Badge>
      );
    }
    if (solicitacaoCancelamento === "aluno") {
      return (
        <Badge variant="destructive">Cancelamento Solicitado (Aluno)</Badge>
      );
    }
    if (solicitacaoCancelamento === "professor") {
      // Embora o professor cancele direto, mantemos caso a lógica mude
      return (
        <Badge variant="destructive">Cancelamento Solicitado (Prof)</Badge>
      );
    }
    // Renderiza o status normal se não houver solicitações
    switch (status) {
      case "em desenvolvimento":
        return <Badge>Em Desenvolvimento</Badge>;
      case "finalizado":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Finalizado</Badge>
        );
      case "cancelado": // Status final após cancelamento (histórico)
        return <Badge variant="destructive">Cancelado</Badge>;
      case "pausado":
        return <Badge variant="secondary">Pausado</Badge>;
      case "encerrado": // Status final após cancelamento (histórico)
        return <Badge variant="destructive">Encerrado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Condições para desabilitar ações gerais
  const isActionDisabled =
    isSubmittingAction || // Se alguma ação já está em progresso
    orientacao.solicitacao_cancelamento !== "nenhuma" || // Se há solicitação de cancelamento
    orientacao.solicitacao_finalizacao !== "nenhuma" || // Se há solicitação de finalização
    ["cancelado", "encerrado", "finalizado"].includes(orientacao.status); // Se já está em estado final

  // Condições específicas para habilitar/desabilitar cada item do menu de ações
  const canFinalizar = // Professor pode finalizar direto?
    userRole === "professor" &&
    ["em desenvolvimento", "pausado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma" &&
    orientacao.solicitacao_finalizacao === "nenhuma"; // Apenas se aluno NÃO solicitou

  const canConfirmarFinalizacao = // Professor pode confirmar solicitação do aluno?
    userRole === "professor" &&
    orientacao.solicitacao_finalizacao === "aluno" &&
    !isSubmittingAction; // Não precisa checar outros 'isActionDisabled' pois a solicitação já existe

  const canSolicitarFinalizacao = // Aluno pode solicitar finalização?
    userRole === "aluno" &&
    ["em desenvolvimento", "pausado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma" &&
    orientacao.solicitacao_finalizacao === "nenhuma";

  const canCancelarDireto = // Professor pode cancelar direto?
    userRole === "professor" &&
    !["finalizado", "encerrado", "cancelado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma" &&
    orientacao.solicitacao_finalizacao === "nenhuma";

  const canSolicitarCancelamento = // Aluno pode solicitar cancelamento?
    userRole === "aluno" &&
    !["finalizado", "encerrado", "cancelado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma" &&
    orientacao.solicitacao_finalizacao === "nenhuma";

  const canConfirmarCancelamento = // Professor pode confirmar solicitação do aluno?
    userRole === "professor" &&
    orientacao.solicitacao_cancelamento === "aluno" &&
    !isSubmittingAction;

  return (
    <Card className="max-w-4xl mx-auto relative">
      {/* Botão de Engrenagem e Dropdown (Apenas se não finalizado/encerrado/cancelado) */}
      {!["finalizado", "encerrado", "cancelado"].includes(
        orientacao.status
      ) && (
        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isSubmittingAction} // Desabilita durante qualquer ação
                aria-label="Opções da Orientação"
              >
                {isSubmittingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Opção Solicitar Finalização (Aluno) */}
              {userRole === "aluno" && canSolicitarFinalizacao && (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-900/50"
                  onClick={handleSolicitarFinalizacao}
                  disabled={isSubmittingAction}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Solicitar Finalização
                </DropdownMenuItem>
              )}

              {/* Opção Finalizar TCC Direto (Professor) */}
              {userRole === "professor" && canFinalizar && (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-900/50"
                  onClick={handleOpenFinalizarOrientacaoModal}
                  disabled={isSubmittingAction}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalizar TCC (Direto)
                </DropdownMenuItem>
              )}

              {/* Separador */}
              {(canSolicitarFinalizacao ||
                canFinalizar ||
                canSolicitarCancelamento ||
                canCancelarDireto) && <DropdownMenuSeparator />}

              {/* Opção Cancelar Orientação (Professor) */}
              {userRole === "professor" && canCancelarDireto && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/50"
                  onClick={handleCancelarDireto}
                  disabled={isSubmittingAction}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancelar Orientação
                </DropdownMenuItem>
              )}

              {/* Opção Solicitar Cancelamento (Aluno) */}
              {userRole === "aluno" && canSolicitarCancelamento && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/50"
                  onClick={handleSolicitarCancelamento}
                  disabled={isSubmittingAction}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Solicitar Cancelamento
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Cabeçalho do Card */}
      <CardHeader>
        <CardTitle>{orientacao.ideiaTcc.titulo}</CardTitle>
        <CardDescription>
          {userRole === "aluno"
            ? `Professor: ${orientacao.professor.usuario.nome}`
            : `Aluno: ${orientacao.aluno.dadosUsuario.nome}`}
        </CardDescription>
      </CardHeader>

      {/* Conteúdo do Card */}
      <CardContent className="space-y-6">
        {/* Alerta de Solicitação de Finalização Pendente */}
        {orientacao.solicitacao_finalizacao === "aluno" && (
          <Alert
            variant="default"
            className="border-blue-500/50 text-blue-700 dark:text-blue-300 dark:border-blue-500/60"
          >
            <CheckCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">
              Solicitação de Finalização Pendente
            </AlertTitle>
            <AlertDescription>
              {userRole === "aluno"
                ? "Você solicitou a finalização desta orientação. Aguardando confirmação do professor."
                : "O aluno solicitou a finalização desta orientação."}
            </AlertDescription>
            {userRole === "professor" && (
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleOpenConfirmarFinalizacaoModal} // Abre modal de feedback
                  disabled={!canConfirmarFinalizacao || isSubmittingAction} // Usa a condição específica
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmittingAction && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar Finalização
                </Button>
              </div>
            )}
          </Alert>
        )}

        {/* Alerta de Solicitação de Cancelamento Pendente */}
        {orientacao.solicitacao_cancelamento === "aluno" && (
          <Alert variant="destructive">
            <MessageSquareWarning className="h-4 w-4" />
            <AlertTitle>Solicitação de Cancelamento Pendente</AlertTitle>
            <AlertDescription>
              {userRole === "aluno"
                ? "Você solicitou o cancelamento. Aguardando confirmação do professor."
                : "O aluno solicitou o cancelamento desta orientação."}
            </AlertDescription>
            {userRole === "professor" && (
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleOpenConfirmarCancelamentoModal} // Abre o modal unificado
                  disabled={!canConfirmarCancelamento || isSubmittingAction} // Usa a condição específica
                >
                  {isSubmittingAction && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Aceitar/Comentar Cancelamento
                </Button>
              </div>
            )}
          </Alert>
        )}

        {/* Detalhes da Orientação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Status</Label>
            <div className="mt-1">
              {renderStatusBadge(
                orientacao.status,
                orientacao.solicitacao_cancelamento,
                orientacao.solicitacao_finalizacao
              )}
            </div>
          </div>
          <div>
            <Label>Data de Início</Label>
            <p className="text-sm mt-1">
              {new Date(orientacao.data_inicio).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div>
            <Label>Data de Fim</Label>
            <p className="text-sm mt-1">
              {orientacao.data_fim
                ? new Date(orientacao.data_fim).toLocaleDateString("pt-BR")
                : "Não definida"}
            </p>
          </div>
        </div>

        {/* Campos Editáveis/Visíveis */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url_projeto">
                URL do Projeto (Google Drive, GitHub, etc.)
              </Label>
              <Input
                id="url_projeto"
                name="url_projeto"
                value={formData.url_projeto}
                onChange={handleChange}
                disabled={isActionDisabled} // Desabilita se ações pendentes ou finalizado
              />
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={5}
                disabled={isActionDisabled}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>URL do Projeto</Label>
              {orientacao.url_projeto ? (
                <a
                  href={
                    orientacao.url_projeto.startsWith("http")
                      ? orientacao.url_projeto
                      : `http://${orientacao.url_projeto}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline block mt-1 break-all"
                >
                  {orientacao.url_projeto}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum link adicionado.
                </p>
              )}
            </div>
            <div>
              <Label>Observações</Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                {orientacao.observacoes || "Nenhuma observação."}
              </p>
            </div>
            {/* Exibe Feedback de Finalização ou Encerramento */}
            {orientacao.feedback_cancelamento && (
              <div>
                <Label
                  className={
                    orientacao.status === "finalizado"
                      ? "text-green-600"
                      : "text-destructive"
                  }
                >
                  Feedback de{" "}
                  {orientacao.status === "finalizado"
                    ? "Finalização"
                    : "Encerramento"}
                </Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border border-dashed border-muted-foreground/50 p-2 rounded">
                  {orientacao.feedback_cancelamento}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Seções de Tópicos e Reuniões (se aplicável) */}
        {!["finalizado", "cancelado", "encerrado"].includes(
          orientacao.status
        ) && (
          <>
            <TopicosSection
              onOpen={() => setTopicosModalOpen(true)}
              newTopicsCount={newTopicsCount}
            />
            <ReunioesSection
              reunioes={reunioes}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenEditModal={handleOpenEditModal}
              onStatusChange={handleReuniaoStatusChange}
            />
          </>
        )}
      </CardContent>

      {/* Rodapé com Botão Editar/Salvar (se aplicável) */}
      {!["finalizado", "cancelado", "encerrado"].includes(
        orientacao.status
      ) && (
        <CardFooter className="flex justify-end">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isActionDisabled} // Desabilita se ações pendentes
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateDetails} disabled={isActionDisabled}>
                Salvar
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isActionDisabled} // Desabilita se ações pendentes
            >
              Editar Detalhes
            </Button>
          )}
        </CardFooter>
      )}

      {/* --- Modais --- */}
      {/* Modal de Confirmação Genérico */}
      <ConfirmationDialog
        open={confirmationState.open}
        onOpenChange={(isOpen) =>
          !isOpen &&
          setConfirmationState({
            open: false,
            title: "",
            description: "",
            onConfirm: () => {},
          })
        }
        title={confirmationState.title}
        description={confirmationState.description}
        onConfirm={confirmationState.onConfirm}
        isSubmitting={isSubmittingAction} // Passa o estado de loading
      />

      {/* Modal para Criar/Editar Reunião */}
      <Dialog
        open={reuniaoModalState.open}
        onOpenChange={(isOpen) => !isOpen && handleCloseReuniaoModal()}
      >
        <ReuniaoModal
          orientacaoId={orientacao.id_orientacao} // Passa o ID da orientação atual
          initialData={reuniaoModalState.initialData}
          onSave={() => {
            fetchReunioes(); // Atualiza lista de reuniões
            handleCloseReuniaoModal(); // Fecha o modal
          }}
          onClose={handleCloseReuniaoModal}
        />
      </Dialog>

      {/* Modal para Visualizar/Gerenciar Tópicos */}
      <Dialog open={topicosModalOpen} onOpenChange={setTopicosModalOpen}>
        <TopicosDialog
          orientacao={orientacao} // Passa a orientação atual
          userRole={userRole}
          onOpenChange={setTopicosModalOpen}
          onTopicUpdate={fetchTopicos} // Atualiza lista de tópicos
          topicosList={topicos} // Passa a lista atual de tópicos
        />
      </Dialog>

      {/* Modal UNIFICADO para feedback de Finalização/Cancelamento */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        {/* Adiciona aria-labelledby e id ao DialogTitle */}
        <DialogContent aria-labelledby="feedback-dialog-title-orientacao">
          <DialogHeader>
            <DialogTitle id="feedback-dialog-title-orientacao">
              {
                feedbackActionType === "finalize" // Finalização Direta (Professor)
                  ? "Finalizar Orientação"
                  : feedbackActionType === "confirm-finalize" // Confirmação Finalização (Professor)
                  ? "Confirmar Finalização Solicitada"
                  : orientacao.solicitacao_cancelamento === "aluno" // Confirmação Cancelamento (Professor)
                  ? "Confirmar Cancelamento Solicitado"
                  : "Cancelar Orientação (Professor)" /* Cancelamento Direto (Professor) */
              }
            </DialogTitle>
            <DialogDescription>
              {feedbackActionType === "finalize" ||
              feedbackActionType === "confirm-finalize"
                ? 'A orientação será movida para o status "Finalizado". Você pode adicionar um feedback opcional para o aluno sobre o TCC.'
                : 'A orientação será movida para o status "Encerrado". Você pode adicionar um feedback opcional sobre o motivo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="feedback_text">Feedback (Opcional)</Label>
            <Textarea
              id="feedback_text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={
                feedbackActionType === "finalize" ||
                feedbackActionType === "confirm-finalize"
                  ? "Comentários finais sobre o TCC, pontos positivos, etc."
                  : "Motivo do encerramento, próximos passos, etc."
              }
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFeedbackModalOpen(false)}
              disabled={isSubmittingAction}
            >
              Voltar
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingAction}
              className={
                feedbackActionType?.includes("finalize") // ADDED: Optional chaining ?.
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              } // Estilo condicional
            >
              {isSubmittingAction && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar{" "}
              {feedbackActionType?.includes("finalize") // ADDED: Optional chaining ?.
                ? "Finalização"
                : "Encerramento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrientacaoCard;
