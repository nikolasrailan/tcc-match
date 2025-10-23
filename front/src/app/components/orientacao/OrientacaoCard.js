"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  getReunioes,
  atualizarReuniao,
  getTopicos,
  solicitarCancelamentoOrientacao, // Importa a nova função
  confirmarCancelamentoOrientacao, // Importa a nova função
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Importa DropdownMenu
import { Settings, Ban, MessageSquareWarning, Loader2 } from "lucide-react"; // Importa ícones
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
  onUpdate,
  onCancelSuccess,
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
  const [isSubmittingCancelamento, setIsSubmittingCancelamento] =
    useState(false); // Loading state

  const [formData, setFormData] = useState({
    url_projeto: orientacao.url_projeto || "",
    observacoes: orientacao.observacoes || "",
    // Não incluir status ou solicitação_cancelamento aqui para evitar conflitos
  });

  // Atualiza o formData se a orientação mudar (caso de abas do professor)
  useEffect(() => {
    setFormData({
      url_projeto: orientacao.url_projeto || "",
      observacoes: orientacao.observacoes || "",
    });
    // Reseta o estado de edição se a orientação mudar
    setIsEditing(false);
  }, [orientacao]);

  const fetchReunioes = useCallback(async () => {
    if (orientacao.id_orientacao) {
      const data = await getReunioes(orientacao.id_orientacao);
      if (data) {
        setReunioes(data);
      }
    }
  }, [orientacao.id_orientacao]);

  const fetchTopicos = useCallback(async () => {
    if (orientacao.id_orientacao) {
      const data = await getTopicos(orientacao.id_orientacao);
      if (data) {
        setTopicos(data);
      }
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
    // Chama a função onUpdate passada como prop, apenas com os dados editáveis
    onUpdate(orientacao.id_orientacao, formData);
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

  // --- Funções de Cancelamento ---
  const handleSolicitarCancelamento = () => {
    setConfirmationState({
      open: true,
      title: "Solicitar Cancelamento",
      description:
        "Tem certeza que deseja solicitar o cancelamento desta orientação? O professor precisará confirmar.",
      onConfirm: async () => {
        setIsSubmittingCancelamento(true);
        try {
          const result = await solicitarCancelamentoOrientacao(
            orientacao.id_orientacao
          );
          toast.success(
            result.message || "Solicitação de cancelamento enviada."
          );
          onCancelSuccess(); // Chama a função para atualizar a lista de orientações
        } catch (error) {
          toast.error(`Erro ao solicitar cancelamento: ${error.message}`);
        } finally {
          setIsSubmittingCancelamento(false);
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
    setFeedbackCancelamento(""); // Limpa feedback anterior
    setCancelamentoFeedbackModalOpen(true);
  };

  const handleConfirmarCancelamento = async () => {
    setIsSubmittingCancelamento(true);
    try {
      const result = await confirmarCancelamentoOrientacao(
        orientacao.id_orientacao,
        feedbackCancelamento
      );
      toast.success(result.message || "Orientação encerrada com sucesso.");
      setCancelamentoFeedbackModalOpen(false);
      onCancelSuccess(); // Chama a função para atualizar a lista de orientações
    } catch (error) {
      toast.error(`Erro ao confirmar cancelamento: ${error.message}`);
    } finally {
      setIsSubmittingCancelamento(false);
    }
  };

  // ------------------------------

  const newTopicsCount =
    userRole === "professor"
      ? topicos.filter((t) => t.status === "enviado").length
      : 0;

  const renderStatusBadge = (status, solicitacaoCancelamento) => {
    if (solicitacaoCancelamento === "aluno") {
      return <Badge variant="destructive">Cancelamento Solicitado</Badge>;
    }
    switch (status) {
      case "em desenvolvimento":
        return <Badge>Em Desenvolvimento</Badge>;
      case "finalizado":
        return <Badge className="bg-green-500">Finalizado</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "pausado":
        return <Badge variant="secondary">Pausado</Badge>;
      case "encerrado": // Novo status
        return <Badge variant="destructive">Encerrado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Desabilita edição e outras ações se houver solicitação de cancelamento ou se estiver encerrado/cancelado
  const isActionDisabled =
    orientacao.solicitacao_cancelamento !== "nenhuma" ||
    ["cancelado", "encerrado"].includes(orientacao.status);

  return (
    <Card className="max-w-4xl mx-auto relative">
      {" "}
      {/* Adiciona relative para posicionar o dropdown */}
      {/* Botão de Engrenagem e Dropdown (Apenas Aluno e se não desabilitado) */}
      {userRole === "aluno" && !isActionDisabled && (
        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isSubmittingCancelamento}
              >
                {isSubmittingCancelamento ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/50"
                onClick={handleSolicitarCancelamento}
                disabled={isSubmittingCancelamento}
              >
                <Ban className="mr-2 h-4 w-4" />
                Solicitar Cancelamento
              </DropdownMenuItem>
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
            <AlertTitle>Solicitação de Cancelamento</AlertTitle>
            <AlertDescription>
              {userRole === "aluno"
                ? "Você solicitou o cancelamento desta orientação. Aguardando confirmação do professor."
                : "O aluno solicitou o cancelamento desta orientação."}
            </AlertDescription>
            {userRole === "professor" && (
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleOpenConfirmarCancelamentoModal}
                  disabled={isSubmittingCancelamento}
                >
                  {isSubmittingCancelamento && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Aceitar Cancelamento
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
            {/* Mostra feedback de cancelamento se existir */}
            {orientacao.feedback_cancelamento && (
              <div>
                <Label className="text-destructive">
                  Feedback de Cancelamento/Encerramento
                </Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border border-dashed border-destructive/50 p-2 rounded">
                  {orientacao.feedback_cancelamento}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Renderiza seções apenas se não estiver cancelado/encerrado */}
        {!["cancelado", "encerrado"].includes(orientacao.status) && (
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
      {/* Esconde botões de editar se estiver cancelado/encerrado */}
      {!["cancelado", "encerrado"].includes(orientacao.status) && (
        <CardFooter className="flex justify-end">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isActionDisabled}
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
              disabled={isActionDisabled}
            >
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
      {/* Modal para feedback de cancelamento do professor */}
      <Dialog
        open={cancelamentoFeedbackModalOpen}
        onOpenChange={setCancelamentoFeedbackModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirmar Cancelamento e Encerrar Orientação
            </DialogTitle>
            <DialogDescription>
              A orientação será movida para o status "Encerrado". Você pode
              adicionar um feedback opcional para o aluno sobre o motivo.
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
              disabled={isSubmittingCancelamento}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarCancelamento}
              disabled={isSubmittingCancelamento}
            >
              {isSubmittingCancelamento && (
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
