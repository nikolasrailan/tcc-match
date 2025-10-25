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
  solicitarFinalizacaoOrientacao, // Importa solicitar finalização
  confirmarFinalizacaoOrientacao, // Importa confirmar finalização
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
import ConfirmationDialog from "../reuniao/ConfirmacaoDialog";
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
  onActionSuccess,
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

  useEffect(() => {
    setFormData({
      url_projeto: orientacao.url_projeto || "",
      observacoes: orientacao.observacoes || "",
    });
    setIsEditing(false);
    setFeedbackText("");
    setFeedbackActionType(null);
    setIsSubmittingAction(false);
  }, [orientacao]);

  const fetchReunioes = useCallback(async () => {
    if (orientacao.id_orientacao) {
      const data = await getReunioes(orientacao.id_orientacao);
      if (data) setReunioes(data);
    }
  }, [orientacao.id_orientacao]);

  const fetchTopicos = useCallback(async () => {
    if (orientacao.id_orientacao) {
      const data = await getTopicos(orientacao.id_orientacao);
      if (data) setTopicos(data);
    }
  }, [orientacao.id_orientacao]);

  useEffect(() => {
    fetchReunioes();
    fetchTopicos();
  }, [fetchReunioes, fetchTopicos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateDetails = () => {
    onUpdate(orientacao.id_orientacao, formData);
    setIsEditing(false);
  };

  const handleOpenCreateModal = () =>
    setReuniaoModalState({ open: true, initialData: null });
  const handleOpenEditModal = (reuniao) =>
    setReuniaoModalState({ open: true, initialData: reuniao });
  const handleCloseReuniaoModal = () =>
    setReuniaoModalState({ open: false, initialData: null });

  const handleReuniaoStatusChange = (reuniaoId, status) => {
    const actionText =
      status === "realizada" ? "marcar como realizada" : "cancelar";
    setConfirmationState({
      open: true,
      title: `Confirmar Ação`,
      description: `Tem certeza que deseja ${actionText} esta reunião?`,
      onConfirm: async () => {
        setIsSubmittingAction(true);
        try {
          await atualizarReuniao(reuniaoId, { status });
          toast.success(
            `Reunião ${
              status === "realizada" ? "marcada como realizada" : "cancelada"
            }.`
          );
          fetchReunioes();
        } catch (error) {
          toast.error(`Erro ao ${actionText} reunião: ${error.message}`);
        } finally {
          setIsSubmittingAction(false);
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

  // --- Funções de Cancelamento e Finalização ---

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
          onActionSuccess();
        } catch (error) {
          toast.error(`Erro ao solicitar finalização: ${error.message}`);
        } finally {
          setIsSubmittingAction(false);
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

  // Professor abre modal para confirmar finalização solicitada
  const handleOpenConfirmarFinalizacaoModal = () => {
    setFeedbackText("");
    setFeedbackActionType("confirm-finalize"); // Novo tipo de ação
    setFeedbackModalOpen(true);
  };

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
          onActionSuccess();
        } catch (error) {
          toast.error(`Erro ao solicitar cancelamento: ${error.message}`);
        } finally {
          setIsSubmittingAction(false);
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

  const handleOpenConfirmarCancelamentoModal = () => {
    setFeedbackText("");
    setFeedbackActionType("cancel");
    setFeedbackModalOpen(true);
  };

  const handleCancelarDireto = () => {
    setFeedbackText("");
    setFeedbackActionType("cancel");
    setFeedbackModalOpen(true);
  };

  const handleOpenFinalizarOrientacaoModal = () => {
    setFeedbackText("");
    setFeedbackActionType("finalize");
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    setIsSubmittingAction(true);
    try {
      let result;
      if (feedbackActionType === "finalize") {
        // Professor finalizando diretamente
        result = await finalizarOrientacao(orientacao.id_orientacao, {
          feedback_cancelamento: feedbackText,
        });
        toast.success(result.message || "Orientação finalizada com sucesso!");
      } else if (feedbackActionType === "confirm-finalize") {
        // Professor confirmando solicitação do aluno
        result = await confirmarFinalizacaoOrientacao(
          orientacao.id_orientacao,
          feedbackText // Envia o feedback
        );
        toast.success(result.message || "Orientação finalizada com sucesso!");
      } else if (feedbackActionType === "cancel") {
        // Lógica de cancelamento (confirmar ou direto)
        if (orientacao.solicitacao_cancelamento === "aluno") {
          result = await confirmarCancelamentoOrientacao(
            orientacao.id_orientacao,
            feedbackText
          );
          toast.success(result.message || "Orientação encerrada com sucesso.");
        } else {
          result = await cancelarOrientacaoDiretoProfessor(
            orientacao.id_orientacao,
            feedbackText
          );
          toast.success(
            result.message || "Orientação encerrada pelo professor."
          );
        }
      }
      setFeedbackModalOpen(false);
      onActionSuccess();
    } catch (error) {
      const actionText = feedbackActionType?.includes("finalize")
        ? "finalizar"
        : "encerrar";
      toast.error(
        `Erro ao ${actionText || "processar"} orientação: ${error.message}`
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ------------------------------

  const newTopicsCount =
    userRole === "professor"
      ? topicos.filter((t) => t.status === "enviado").length
      : 0;

  const renderStatusBadge = (
    status,
    solicitacaoCancelamento,
    solicitacaoFinalizacao
  ) => {
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
      return (
        <Badge variant="destructive">Cancelamento Solicitado (Prof)</Badge>
      );
    }
    switch (status) {
      case "em desenvolvimento":
        return <Badge>Em Desenvolvimento</Badge>;
      case "finalizado":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Finalizado</Badge>
        );
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "pausado":
        return <Badge variant="secondary">Pausado</Badge>;
      case "encerrado":
        return <Badge variant="destructive">Encerrado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Condições para desabilitar ações
  const isActionDisabled =
    isSubmittingAction ||
    orientacao.solicitacao_cancelamento !== "nenhuma" ||
    orientacao.solicitacao_finalizacao !== "nenhuma" || // Adiciona verificação de solicitação de finalização
    ["cancelado", "encerrado", "finalizado"].includes(orientacao.status);

  // Condições específicas para cada item do menu
  const canFinalizar =
    userRole === "professor" &&
    ["em desenvolvimento", "pausado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma" &&
    orientacao.solicitacao_finalizacao === "nenhuma"; // Professor só finaliza direto se aluno não solicitou
  const canConfirmarFinalizacao =
    userRole === "professor" &&
    orientacao.solicitacao_finalizacao === "aluno" &&
    !isActionDisabled; // Professor pode confirmar se aluno solicitou
  const canSolicitarFinalizacao =
    userRole === "aluno" &&
    ["em desenvolvimento", "pausado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma" &&
    orientacao.solicitacao_finalizacao === "nenhuma"; // Aluno pode solicitar
  const canCancelarDireto =
    userRole === "professor" &&
    !["finalizado", "encerrado", "cancelado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma" &&
    orientacao.solicitacao_finalizacao === "nenhuma";
  const canSolicitarCancelamento =
    userRole === "aluno" &&
    !["finalizado", "encerrado", "cancelado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma" &&
    orientacao.solicitacao_finalizacao === "nenhuma";

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
                disabled={isSubmittingAction}
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
              {userRole === "aluno" && (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-900/50"
                  onClick={handleSolicitarFinalizacao}
                  disabled={!canSolicitarFinalizacao || isSubmittingAction}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />{" "}
                  {/* Ícone diferente */}
                  Solicitar Finalização
                </DropdownMenuItem>
              )}

              {/* Opção Finalizar TCC Direto (Professor) */}
              {userRole === "professor" && (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-900/50"
                  onClick={handleOpenFinalizarOrientacaoModal}
                  disabled={!canFinalizar || isSubmittingAction}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalizar TCC (Direto)
                </DropdownMenuItem>
              )}

              {/* Separador se houver opções de cancelamento */}
              {(canCancelarDireto ||
                canSolicitarCancelamento ||
                canSolicitarFinalizacao) && <DropdownMenuSeparator />}

              {/* Opção Cancelar Orientação (Professor) */}
              {userRole === "professor" && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/50"
                  onClick={handleCancelarDireto}
                  disabled={!canCancelarDireto || isSubmittingAction}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancelar Orientação
                </DropdownMenuItem>
              )}

              {/* Opção Solicitar Cancelamento (Aluno) */}
              {userRole === "aluno" && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/50"
                  onClick={handleSolicitarCancelamento}
                  disabled={!canSolicitarCancelamento || isSubmittingAction}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Solicitar Cancelamento
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <CardHeader>
        <CardTitle>{orientacao.ideiaTcc.titulo}</CardTitle>
        <CardDescription>
          {userRole === "aluno"
            ? `Professor: ${orientacao.professor.usuario.nome}`
            : `Aluno: ${orientacao.aluno.dadosUsuario.nome}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerta de Solicitação de Finalização */}
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
                  variant="default" // Pode ajustar a variante se preferir
                  onClick={handleOpenConfirmarFinalizacaoModal} // Abre modal de feedback
                  disabled={isSubmittingAction}
                  className="bg-green-600 hover:bg-green-700 text-white" // Estilo para destacar
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

        {/* Alerta de Solicitação de Cancelamento */}
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
                  variant="destructive" // Mantém a variante destrutiva
                  onClick={handleOpenConfirmarCancelamentoModal} // Abre o modal unificado
                  disabled={isSubmittingAction}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Status</Label>
            <div className="mt-1">
              {renderStatusBadge(
                orientacao.status,
                orientacao.solicitacao_cancelamento,
                orientacao.solicitacao_finalizacao // Passa o novo campo
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

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url_projeto">
                {" "}
                URL do Projeto (Google Drive, GitHub, etc.){" "}
              </Label>
              <Input
                id="url_projeto"
                name="url_projeto"
                value={formData.url_projeto}
                onChange={handleChange}
                disabled={isActionDisabled}
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
                  {" "}
                  {orientacao.url_projeto}{" "}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  {" "}
                  Nenhum link adicionado.{" "}
                </p>
              )}
            </div>
            <div>
              <Label>Observações</Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                {" "}
                {orientacao.observacoes || "Nenhuma observação."}{" "}
              </p>
            </div>
            {orientacao.feedback_cancelamento && (
              <div>
                <Label
                  className={
                    orientacao.status === "finalizado"
                      ? "text-green-600"
                      : "text-destructive"
                  }
                >
                  {" "}
                  Feedback de{" "}
                  {orientacao.status === "finalizado"
                    ? "Finalização"
                    : "Encerramento"}{" "}
                </Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border border-dashed border-muted-foreground/50 p-2 rounded">
                  {" "}
                  {orientacao.feedback_cancelamento}{" "}
                </p>
              </div>
            )}
          </div>
        )}

        {!["finalizado", "cancelado", "encerrado"].includes(
          orientacao.status
        ) && (
          <>
            <TopicosSection
              onOpen={() => setTopicosModalOpen(true)}
              newTopicsCount={newTopicsCount}
              disabled={isActionDisabled}
            />
            <ReunioesSection
              reunioes={reunioes}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenEditModal={handleOpenEditModal}
              onStatusChange={handleReuniaoStatusChange}
              disabled={isActionDisabled}
            />
          </>
        )}
      </CardContent>
      {!["finalizado", "cancelado", "encerrado"].includes(
        orientacao.status
      ) && (
        <CardFooter className="flex justify-end">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isActionDisabled}
              >
                {" "}
                Cancelar{" "}
              </Button>
              <Button onClick={handleUpdateDetails} disabled={isActionDisabled}>
                {" "}
                Salvar{" "}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isActionDisabled}
            >
              {" "}
              Editar Detalhes{" "}
            </Button>
          )}
        </CardFooter>
      )}
      {/* --- Modais --- */}
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
        disabled={isSubmittingAction}
      />
      <Dialog
        open={reuniaoModalState.open}
        onOpenChange={(isOpen) => !isOpen && handleCloseReuniaoModal()}
      >
        <ReuniaoModal
          orientacaoId={orientacao.id_orientacao}
          initialData={reuniaoModalState.initialData}
          onSave={() => {
            fetchReunioes();
            handleCloseReuniaoModal();
          }}
          onClose={handleCloseReuniaoModal}
        />
      </Dialog>
      <Dialog open={topicosModalOpen} onOpenChange={setTopicosModalOpen}>
        <TopicosDialog
          orientacao={orientacao}
          userRole={userRole}
          onOpenChange={setTopicosModalOpen}
          onTopicUpdate={fetchTopicos}
          topicosList={topicos}
        />
      </Dialog>
      {/* Modal UNIFICADO para feedback */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent>
          {/* ... existing code ... */}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFeedbackModalOpen(false)}
              disabled={isSubmittingAction}
            >
              {" "}
              Voltar{" "}
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar{" "}
              {feedbackActionType?.includes("finalize")
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
