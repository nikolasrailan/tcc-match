"use client";
import React, { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { deletarTopico, atualizarTopico, criarTopico } from "@/api/apiService";
import { toast } from "sonner";
import {
  PlusCircle,
  Edit,
  Trash2,
  MessageSquare,
  Eye,
  Check,
} from "lucide-react";
import TopicoForm from "../topico/TopicoForm";
import ConfirmationDialog from "../reuniao/ConfirmacaoDialog";

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
  });
  const [commentingTopico, setCommentingTopico] = useState(null);
  const [comentario, setComentario] = useState("");

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
      onConfirm: async () => {
        try {
          await deletarTopico(id_topico);
          toast.success("Tópico excluído com sucesso.");
          onTopicUpdate();
        } catch (error) {
          toast.error("Erro ao excluir tópico.");
        }
        setConfirmState({ open: false, onConfirm: () => {} });
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
    try {
      await atualizarTopico(commentingTopico.id_topico, {
        comentario_professor: comentario,
      });
      toast.success("Comentário salvo!");
      onTopicUpdate();
      setCommentingTopico(null);
    } catch (error) {
      toast.error("Erro ao salvar comentário.");
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tópicos da Orientação</DialogTitle>
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
                  {topicosList.length > 0 ? (
                    topicosList.map((topico) => (
                      <TableRow key={topico.id_topico}>
                        <TableCell className="font-medium">
                          <p>{topico.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {topico.descricao}
                          </p>
                          {topico.comentario_professor && (
                            <p className="text-xs mt-2 p-2 bg-muted rounded-md">
                              <strong>Prof:</strong>{" "}
                              {topico.comentario_professor}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(topico.data_criacao).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(topico.status)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {userRole === "aluno" &&
                            topico.status === "enviado" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingTopico(topico)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(topico.id_topico)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          {userRole === "professor" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenComment(topico)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              {topico.status === "enviado" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange(topico, "visto")
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {topico.status === "visto" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange(topico, "revisado")
                                  }
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

      <ConfirmationDialog
        open={confirmState.open}
        onOpenChange={(isOpen) =>
          !isOpen && setConfirmState({ open: false, onConfirm: () => {} })
        }
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este tópico?"
        onConfirm={confirmState.onConfirm}
      />

      <Dialog
        open={!!commentingTopico}
        onOpenChange={() => setCommentingTopico(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comentário</DialogTitle>
            <DialogDescription>
              Deixe um feedback para o aluno sobre &quot;
              {commentingTopico?.titulo}&quot;.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentingTopico(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveComment}>Salvar Comentário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopicosDialog;
