"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  deletarTopico,
  atualizarTopico,
  criarTopico,
  viewTopico,
} from "@/api/apiService";
import { toast } from "sonner";
import {
  PlusCircle,
  Edit,
  Trash2,
  MessageSquare,
  Eye,
  Check,
} from "lucide-react";
import TopicoForm from "./TopicoForm";
import ConfirmationDialog from "../reuniao/ConfirmacaoDialog";
import { Textarea } from "@/components/ui/textarea";

const TopicosDialog = ({
  orientacao,
  userRole,
  onOpenChange,
  onTopicUpdate,
  topicosList,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTopico, setEditingTopico] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    onConfirm: () => {},
    isSubmitting: false, // Add loading state
  });
  const [commentingTopico, setCommentingTopico] = useState(null);
  const [comentario, setComentario] = useState("");
  const [viewingTopico, setViewingTopico] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false); // Add loading state for comment

  // Generate unique IDs for dialog titles
  const viewDialogTitleId = React.useId();
  const commentDialogTitleId = React.useId();
  const mainDialogTitleId = React.useId(); // ID for the main dialog

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingTopico) {
        await atualizarTopico(editingTopico.id_topico, formData);
        toast.success("Tópico atualizado com sucesso!");
      } else {
        await criarTopico(orientacao.id_orientacao, formData);
        toast.success("Tópico enviado com sucesso!");
      }
      onTopicUpdate();
      setFormOpen(false);
      setEditingTopico(null);
    } catch (error) {
      toast.error("Erro ao salvar tópico.");
    }
  };

  const handleDelete = (id_topico) => {
    setConfirmState({
      open: true,
      title: "Confirmar Exclusão", // Pass title
      description: "Tem certeza que deseja excluir este tópico?", // Pass description
      isSubmitting: false, // Reset loading state
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, isSubmitting: true })); // Set loading
        try {
          await deletarTopico(id_topico);
          toast.success("Tópico excluído com sucesso.");
          onTopicUpdate();
        } catch (error) {
          toast.error("Erro ao excluir tópico.");
        } finally {
          setConfirmState({
            open: false,
            onConfirm: () => {},
            isSubmitting: false,
          }); // Close and reset
        }
      },
    });
  };

  const handleStatusChange = async (topico, status) => {
    try {
      await atualizarTopico(topico.id_topico, { status });
      toast.success(`Tópico marcado como ${status}!`);
      onTopicUpdate();
    } catch (error) {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleOpenComment = (topico) => {
    setCommentingTopico(topico);
    setComentario(topico.comentario_professor || "");
  };

  const handleSaveComment = async () => {
    setIsSubmittingComment(true); // Start loading
    try {
      await atualizarTopico(commentingTopico.id_topico, {
        comentario_professor: comentario,
      });
      toast.success("Comentário salvo!");
      onTopicUpdate();
      setCommentingTopico(null);
    } catch (error) {
      toast.error("Erro ao salvar comentário.");
    } finally {
      setIsSubmittingComment(false); // Stop loading
    }
  };

  const handleViewTopico = async (topico) => {
    // Se o professor abrir um tópico "enviado", ele será marcado como "visto"
    if (userRole === "professor" && topico.status === "enviado") {
      try {
        const updatedTopico = await viewTopico(topico.id_topico);
        setViewingTopico(updatedTopico);
        onTopicUpdate(); // Atualiza a lista em segundo plano
      } catch (error) {
        toast.error("Erro ao marcar tópico como visto.");
        setViewingTopico(topico); // Abre o tópico mesmo com erro
      }
    } else {
      setViewingTopico(topico);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "revisado")
      return <Badge className="bg-green-500">Revisado</Badge>;
    if (status === "visto") return <Badge>Visto</Badge>;
    return <Badge variant="secondary">Enviado</Badge>;
  };

  return (
    <>
      {/* Main Dialog Content */}
      <DialogContent
        className="max-w-[90vw]"
        aria-labelledby={mainDialogTitleId}
      >
        <DialogHeader>
          <DialogTitle id={mainDialogTitleId}>
            Tópicos da Orientação
          </DialogTitle>
          <DialogDescription>
            Envie documentos e acompanhe o feedback do seu professor.
          </DialogDescription>
        </DialogHeader>

        {formOpen || editingTopico ? (
          <TopicoForm
            onSubmit={handleCreateOrUpdate}
            initialData={editingTopico}
            onClose={() => {
              setFormOpen(false);
              setEditingTopico(null);
            }}
          />
        ) : (
          <>
            <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topicosList && topicosList.length > 0 ? (
                    topicosList.map((topico) => (
                      <TableRow key={topico.id_topico}>
                        <TableCell className="font-medium">
                          <p>{topico.titulo}</p>
                        </TableCell>
                        <TableCell>
                          {new Date(topico.data_criacao).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(topico.status)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {userRole === "aluno" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTopico(topico)}
                                aria-label={`Ver tópico ${topico.titulo}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {topico.status === "enviado" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingTopico(topico)}
                                    aria-label={`Editar tópico ${topico.titulo}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDelete(topico.id_topico)
                                    }
                                    aria-label={`Excluir tópico ${topico.titulo}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                          {userRole === "professor" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTopico(topico)}
                                aria-label={`Ver tópico ${topico.titulo}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {topico.status === "visto" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange(topico, "revisado")
                                  }
                                  aria-label={`Marcar tópico ${topico.titulo} como revisado`}
                                >
                                  <Check className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum tópico enviado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {userRole === "aluno" && (
              <DialogFooter>
                <Button onClick={() => setFormOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tópico
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmationDialog
        open={confirmState.open}
        onOpenChange={(isOpen) =>
          !isOpen &&
          setConfirmState({
            open: false,
            onConfirm: () => {},
            isSubmitting: false,
          })
        }
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        isSubmitting={confirmState.isSubmitting} // Pass loading state
        confirmText="Excluir"
        confirmVariant="destructive"
      />

      {/* Dialog for Viewing Topic Details */}
      <Dialog
        open={!!viewingTopico}
        onOpenChange={() => setViewingTopico(null)}
      >
        <DialogContent
          className="max-w-4xl"
          aria-labelledby={viewDialogTitleId}
        >
          <DialogHeader>
            <DialogTitle id={viewDialogTitleId}>
              {viewingTopico?.titulo}
            </DialogTitle>
            <DialogDescription>
              Enviado em{" "}
              {viewingTopico
                ? new Date(viewingTopico.data_criacao).toLocaleDateString()
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              {viewingTopico?.descricao}
            </p>
            {viewingTopico?.comentario_professor && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-semibold">
                  Comentário do Professor:
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {viewingTopico?.comentario_professor}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {userRole === "professor" && (
              <Button
                variant="outline"
                onClick={() => {
                  handleOpenComment(viewingTopico);
                  setViewingTopico(null);
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Comentar
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewingTopico(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Adding/Editing Comment */}
      <Dialog
        open={!!commentingTopico}
        onOpenChange={() => setCommentingTopico(null)}
      >
        <DialogContent aria-labelledby={commentDialogTitleId}>
          <DialogHeader>
            <DialogTitle id={commentDialogTitleId}>
              Adicionar Comentário
            </DialogTitle>
            <DialogDescription>
              Deixe um feedback para o aluno sobre &quot;
              {commentingTopico?.titulo}&quot;.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
            aria-label="Comentário do professor"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCommentingTopico(null)}
              disabled={isSubmittingComment}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveComment} disabled={isSubmittingComment}>
              {isSubmittingComment && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Comentário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopicosDialog;
