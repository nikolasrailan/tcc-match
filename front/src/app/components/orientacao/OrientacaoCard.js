"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  getReunioes,
  atualizarReuniao,
  getTopicos,
  solicitarCancelamentoOrientacao,
  confirmarCancelamentoOrientacao,
  cancelarOrientacaoDiretoProfessor, // Importa cancelamento direto
  finalizarOrientacao, // Importa a nova função de finalizar
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
  DropdownMenuSeparator, // Import Separator
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importa DropdownMenu
import {
  Settings,
  Ban,
  MessageSquareWarning,
  Loader2,
  CheckCircle, // Importa ícone de finalizar
} from "lucide-react"; // Importa ícones
import ConfirmationDialog from "../reuniao/ConfirmacaoDialog";
import ReuniaoModal from "../reuniao/ReuniaoModal";
import TopicosDialog from "../topico/TopicoDialog";
import ReunioesSection from "../reuniao/ReuniaoSecao";
import TopicosSection from "../topico/TopicosSecao";
import { toast } from "sonner"; // Para notificações
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const OrientacaoCard = ({
  orientacao,
  userRole,
  onUpdate, // Mantém para atualizações gerais
  onActionSuccess, // Callback genérico para sucesso de ações (cancelar, finalizar)
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
  const [cancelamentoFeedbackModalOpen, setCancelamentoFeedbackModalOpen] =
    useState(false);
  const [feedbackCancelamento, setFeedbackCancelamento] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false); // Loading state genérico para ações

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
    // Limpa feedback se a orientação mudar
    setFeedbackCancelamento("");
    setIsSubmittingAction(false); // Reseta loading ao mudar card
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
    onUpdate(orientacao.id_orientacao, formData); // Chama a prop onUpdate para salvar
    setIsEditing(false);
  };

  const handleOpenCreateModal = () => {
    setReuniaoModalState({ open: true, initialData: null });
  };

  const handleOpenEditModal = (reuniao) => {
    setReuniaoModalState({ open: true, initialData: reuniao });
  };

  const handleCloseReuniaoModal = () => {
    setReuniaoModalState({ open: false, initialData: null });
  };

  const handleReuniaoStatusChange = (reuniaoId, status) => {
    const actionText =
      status === "realizada" ? "marcar como realizada" : "cancelar";
    const title = `Confirmar Ação`;
    const description = `Tem certeza que deseja ${actionText} esta reunião?`;

    setConfirmationState({
      open: true,
      title,
      description,
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
          onActionSuccess(); // Atualiza a lista
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
    setFeedbackCancelamento("");
    setCancelamentoFeedbackModalOpen(true);
  };

  const handleConfirmarCancelamento = async () => {
    setIsSubmittingAction(true);
    try {
      const result = await confirmarCancelamentoOrientacao(
        orientacao.id_orientacao,
        feedbackCancelamento
      );
      toast.success(result.message || "Orientação encerrada com sucesso.");
      setCancelamentoFeedbackModalOpen(false);
      onActionSuccess(); // Atualiza a lista
    } catch (error) {
      toast.error(`Erro ao confirmar cancelamento: ${error.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handler para cancelamento direto pelo professor
  const handleCancelarDireto = () => {
    setFeedbackCancelamento(""); // Limpa feedback
    setCancelamentoFeedbackModalOpen(true); // Reutiliza o mesmo modal
    // A lógica de qual API chamar será feita no submit do modal
  };

  // Handler para o submit do modal de feedback (usado tanto para confirmar quanto para cancelar direto)
  const handleFeedbackSubmit = async () => {
    setIsSubmittingAction(true);
    try {
      let result;
      // Se há uma solicitação pendente do aluno, confirma o cancelamento
      if (orientacao.solicitacao_cancelamento === "aluno") {
        result = await confirmarCancelamentoOrientacao(
          orientacao.id_orientacao,
          feedbackCancelamento
        );
        toast.success(result.message || "Orientação encerrada com sucesso.");
      } else {
        // Senão, o professor está cancelando diretamente
        result = await cancelarOrientacaoDiretoProfessor(
          orientacao.id_orientacao,
          feedbackCancelamento
        );
        toast.success(result.message || "Orientação encerrada pelo professor.");
      }
      setCancelamentoFeedbackModalOpen(false);
      onActionSuccess(); // Atualiza a lista
    } catch (error) {
      toast.error(`Erro ao encerrar orientação: ${error.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // *** NOVA FUNÇÃO PARA FINALIZAR TCC PELO PROFESSOR ***
  const handleFinalizarOrientacao = () => {
    setConfirmationState({
      open: true,
      title: "Finalizar Orientação",
      description:
        "Tem certeza que deseja marcar esta orientação como finalizada?",
      onConfirm: async () => {
        setIsSubmittingAction(true);
        try {
          const result = await finalizarOrientacao(orientacao.id_orientacao);
          toast.success(result.message || "Orientação finalizada com sucesso!");
          onActionSuccess(); // Atualiza a lista
        } catch (error) {
          toast.error(`Erro ao finalizar orientação: ${error.message}`);
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

  // ------------------------------

  const newTopicsCount =
    userRole === "professor"
      ? topicos.filter((t) => t.status === "enviado").length
      : 0;

  const renderStatusBadge = (status, solicitacaoCancelamento) => {
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
      case "cancelado": // Este status pode não ser mais usado diretamente, substituído por 'encerrado'
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
    ["cancelado", "encerrado", "finalizado"].includes(orientacao.status);

  // Condições específicas para cada item do menu
  const canFinalizar =
    userRole === "professor" &&
    ["em desenvolvimento", "pausado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma";
  const canCancelarDireto =
    userRole === "professor" &&
    !["finalizado", "encerrado", "cancelado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma";
  const canSolicitarCancelamento =
    userRole === "aluno" &&
    !["finalizado", "encerrado", "cancelado"].includes(orientacao.status) &&
    orientacao.solicitacao_cancelamento === "nenhuma";

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
              {/* Opção Finalizar TCC (Professor) */}
              {userRole === "professor" && (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-900/50"
                  onClick={handleFinalizarOrientacao}
                  disabled={!canFinalizar || isSubmittingAction}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalizar TCC
                </DropdownMenuItem>
              )}

              {/* Separador se houver opções de cancelamento */}
              {(canCancelarDireto || canSolicitarCancelamento) && (
                <DropdownMenuSeparator />
              )}

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
                  onClick={handleOpenConfirmarCancelamentoModal}
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
                orientacao.solicitacao_cancelamento
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
                URL do Projeto (Google Drive, GitHub, etc.)
              </Label>
              <Input
                id="url_projeto"
                name="url_projeto"
                value={formData.url_projeto}
                onChange={handleChange}
                disabled={isActionDisabled} // Desabilita se ação não for permitida
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
                disabled={isActionDisabled} // Desabilita se ação não for permitida
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
            {/* Mostra feedback de cancelamento/encerramento se existir */}
            {orientacao.feedback_cancelamento && (
              <div>
                <Label className="text-destructive">
                  Feedback de Encerramento
                </Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border border-dashed border-destructive/50 p-2 rounded">
                  {orientacao.feedback_cancelamento}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Renderiza seções apenas se não estiver finalizado/cancelado/encerrado */}
        {!["finalizado", "cancelado", "encerrado"].includes(
          orientacao.status
        ) && (
          <>
            <TopicosSection
              onOpen={() => setTopicosModalOpen(true)}
              newTopicsCount={newTopicsCount}
              disabled={isActionDisabled} // Passa o estado desabilitado
            />

            <ReunioesSection
              reunioes={reunioes}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenEditModal={handleOpenEditModal}
              onStatusChange={handleReuniaoStatusChange}
              disabled={isActionDisabled} // Passa o estado desabilitado
            />
          </>
        )}
      </CardContent>
      {/* Esconde botões de editar se estiver finalizado/cancelado/encerrado */}
      {!["finalizado", "cancelado", "encerrado"].includes(
        orientacao.status
      ) && (
        <CardFooter className="flex justify-end">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isActionDisabled} // Desabilita
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateDetails} disabled={isActionDisabled}>
                {" "}
                {/* Desabilita */}
                Salvar
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              disabled={isActionDisabled}
            >
              {" "}
              {/* Desabilita */}
              Editar Detalhes
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
        disabled={isSubmittingAction} // Desabilita confirmação durante submit
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
      {/* Modal para feedback de cancelamento/encerramento */}
      <Dialog
        open={cancelamentoFeedbackModalOpen}
        onOpenChange={setCancelamentoFeedbackModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {orientacao.solicitacao_cancelamento === "aluno"
                ? "Confirmar Cancelamento Solicitado"
                : "Cancelar Orientação (Professor)"}
            </DialogTitle>
            <DialogDescription>
              A orientação será movida para o status &quot;Encerrado&quot;. Você
              pode adicionar um feedback opcional{" "}
              {userRole === "professor" ? "para o aluno" : ""} sobre o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="feedback_cancelamento">Feedback (Opcional)</Label>
            <Textarea
              id="feedback_cancelamento"
              value={feedbackCancelamento}
              onChange={(e) => setFeedbackCancelamento(e.target.value)}
              placeholder="Motivo do encerramento, próximos passos, etc."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCancelamentoFeedbackModalOpen(false)}
              disabled={isSubmittingAction}
            >
              Voltar
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Encerramento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrientacaoCard;
