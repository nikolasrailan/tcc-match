"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getCursos,
  criarCurso,
  deletarCurso,
  atualizarCurso,
} from "@/api/apiService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function CursosPage() {
  useAuthRedirect();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cursoEmEdicao, setCursoEmEdicao] = useState(null);
  const [novoCursoNome, setNovoCursoNome] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    const data = await getCursos();
    if (data) {
      setCursos(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  const handleOpenEditModal = (curso) => {
    setCursoEmEdicao(curso);
    setNovaCursoNome(curso.nome);
    setEditModalOpen(true);
    setError("");
  };

  const handleCreateCurso = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!novoCursoNome.trim()) {
      setError("O nome do curso não pode ser vazio.");
      return;
    }
    try {
      await criarCurso({ nome: novoCursoNome });
      toast.success("Curso criado com sucesso!");
      setModalOpen(false);
      fetchCursos();
    } catch (err) {
      setError(err.message || "Erro ao criar curso.");
      toast.error(err.message || "Erro ao atualizar curso.");
    }
  };

  const handleUpdateCurso = async (e) => {
    e.preventDefault();
    if (!cursoEmEdicao) return;
    setError("");
    setSuccess("");
    if (!novoCursoNome.trim()) {
      setError("O nome do curso não pode ser vazio.");
      return;
    }
    try {
      await atualizarCurso(cursoEmEdicao.id_curso, { nome: novoCursoNome });
      toast.success("Curso criado com sucesso!");
      setEditModalOpen(false);
      fetchCursos();
    } catch (err) {
      setError(err.message || "Erro ao atualizar curso.");
      toast.error(err.message || "Erro ao atualizar curso.");
    }
  };

  const handleDeleteCurso = async (cursoId) => {
    toast("Tem certeza que deseja deletar este curso?", {
      action: {
        label: "Deletar",
        onClick: async () => {
          try {
            await deletarCurso(cursoId);
            toast.success("Curso deletado com sucesso!");
            fetchCursos();
          } catch (err) {
            toast.error(err.message || "Erro ao deletar curso.");
          }
        },
      },
      cancel: {
        label: "Cancelar",
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Cursos</h1>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button>Adicionar Novo Curso</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateCurso}>
              <DialogHeader>
                <DialogTitle>Criar Novo Curso</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label htmlFor="nome">Nome do Curso</Label>
                <Input
                  id="nome"
                  value={novoCursoNome}
                  onChange={(e) => setNovoCursoNome(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Confirmar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 bg-green-100 border-green-400 text-green-700">
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome do Curso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cursos.map((curso) => (
              <TableRow key={curso.id_curso}>
                <TableCell className="font-medium">{curso.id_curso}</TableCell>
                <TableCell>{curso.nome}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Dialog
                    open={
                      editModalOpen &&
                      cursoEmEdicao?.id_curso === curso.id_curso
                    }
                    onOpenChange={(isOpen) =>
                      !isOpen && setEditModalOpen(false)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(curso)}
                      >
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleUpdateCurso}>
                        <DialogHeader>
                          <DialogTitle>Editar Curso</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                          <Label htmlFor="nome-edit">Nome do Curso</Label>
                          <Input
                            id="nome-edit"
                            value={novoCursoNome}
                            onChange={(e) => setNovoCursoNome(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="secondary">
                              Cancelar
                            </Button>
                          </DialogClose>
                          <Button type="submit">Salvar Alterações</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCurso(curso.id_curso)}
                  >
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
