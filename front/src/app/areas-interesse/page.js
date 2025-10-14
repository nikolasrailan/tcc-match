"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getAreasInteresse,
  criarAreaInteresse,
  deletarAreaInteresse,
  atualizarAreaInteresse,
  getAreasInteressePendentes,
  aprovarAreaInteresse,
  rejeitarAreaInteresse,
} from "@/api/apiService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="fixed inset-0" onClick={onClose} />
      <Card className="z-10 w-full max-w-md">{children}</Card>
    </div>
  );
};

export default function AreasInteressePage() {
  useAuthRedirect();
  const [areas, setAreas] = useState([]);
  const [areasPendentes, setAreasPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [areaEmEdicao, setAreaEmEdicao] = useState(null);
  const [novaAreaNome, setNovaAreaNome] = useState("");
  const [error, setError] = useState("");

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [areasData, pendentesData] = await Promise.all([
        getAreasInteresse(),
        getAreasInteressePendentes(),
      ]);
      if (areasData) setAreas(areasData);
      if (pendentesData) setAreasPendentes(pendentesData);
    } catch (err) {
      setError("Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleOpenModal = () => {
    setModalOpen(true);
    setNovaAreaNome("");
    setError("");
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleOpenEditModal = (area) => {
    setAreaEmEdicao(area);
    setNovaAreaNome(area.nome);
    setEditModalOpen(true);
    setError("");
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setAreaEmEdicao(null);
    setNovaAreaNome("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!novaAreaNome.trim()) {
      setError("O nome da área não pode ser vazio.");
      return;
    }
    try {
      await criarAreaInteresse({ nome: novaAreaNome });
      handleCloseModal();
      fetchAreas();
    } catch (err) {
      setError(err.message || "Erro ao criar área.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!areaEmEdicao || !novaAreaNome.trim()) {
      setError("O nome da área não pode ser vazio.");
      return;
    }
    try {
      await atualizarAreaInteresse(areaEmEdicao.id_area, {
        nome: novaAreaNome,
      });
      handleCloseEditModal();
      fetchAreas();
    } catch (err) {
      setError(err.message || "Erro ao atualizar área.");
    }
  };

  const handleDelete = async (areaId) => {
    if (window.confirm("Tem certeza que deseja deletar esta área?")) {
      try {
        await deletarAreaInteresse(areaId);
        fetchAreas();
      } catch (err) {
        alert(err.message || "Erro ao deletar área.");
      }
    }
  };

  const handleAprovar = async (id) => {
    try {
      await aprovarAreaInteresse(id);
      fetchAreas();
    } catch (err) {
      alert(err.message || "Erro ao aprovar área.");
    }
  };

  const handleRejeitar = async (id) => {
    if (
      window.confirm(
        "Tem certeza que deseja rejeitar esta sugestão? Ela será excluída permanentemente."
      )
    ) {
      try {
        await rejeitarAreaInteresse(id);
        fetchAreas();
      } catch (err) {
        alert(err.message || "Erro ao rejeitar área.");
      }
    }
  };

  if (loading && !areas.length && !areasPendentes.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Áreas de Interesse</h1>
        <Button onClick={handleOpenModal}>Adicionar Nova Área Aprovada</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sugestões Pendentes</CardTitle>
          <CardDescription>
            Aprove ou rejeite as novas áreas de interesse sugeridas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Sugerido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areasPendentes.length > 0 ? (
                areasPendentes.map((area) => (
                  <TableRow key={area.id_area}>
                    <TableCell className="font-medium">{area.nome}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAprovar(area.id_area)}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejeitar(area.id_area)}
                      >
                        Rejeitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Nenhuma sugestão pendente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Áreas Aprovadas</CardTitle>
          <CardDescription>
            Visualize e gerencie as áreas de interesse existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Nome da Área</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area.id_area}>
                  <TableCell className="font-medium">{area.id_area}</TableCell>
                  <TableCell>{area.nome}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditModal(area)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(area.id_area)}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <form onSubmit={handleCreate}>
          <CardHeader>
            <CardTitle>Criar Nova Área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}
            <div className="space-y-2">
              <Label htmlFor="create-area">Nome da Área</Label>
              <Input
                id="create-area"
                value={novaAreaNome}
                onChange={(e) => setNovaAreaNome(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar</Button>
          </CardFooter>
        </form>
      </Modal>

      <Modal open={editModalOpen} onClose={handleCloseEditModal}>
        <form onSubmit={handleUpdate}>
          <CardHeader>
            <CardTitle>Editar Área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}
            <div className="space-y-2">
              <Label htmlFor="edit-area">Nome da Área</Label>
              <Input
                id="edit-area"
                value={novaAreaNome}
                onChange={(e) => setNovaAreaNome(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleCloseEditModal}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </CardFooter>
        </form>
      </Modal>
    </div>
  );
}
