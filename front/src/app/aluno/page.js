"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getMinhaIdeiaTcc,
  criarIdeiaTcc,
  deletarIdeiaTcc,
  atualizarIdeiaTcc,
  getAreasInteresse,
} from "@/api/apiService";
import IdeiaTccForm from "@/app/components/aluno/ideiaTccForm";
import MinhaIdeiaTccDisplay from "@/app/components/aluno/MinhaIdeiaTccDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AlunoPage() {
  useAuthRedirect();
  const [ideiasTcc, setIdeiasTcc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIdeia, setEditingIdeia] = useState(null);
  const [error, setError] = useState(null);
  const [allAreas, setAllAreas] = useState([]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ideiasData, areasData] = await Promise.all([
        getMinhaIdeiaTcc(),
        getAreasInteresse(),
      ]);

      if (ideiasData) {
        if (Array.isArray(ideiasData)) {
          setIdeiasTcc(ideiasData);
        } else if (ideiasData === null) {
          setError(
            "Você precisa ter um perfil de aluno para acessar esta página."
          );
        }
      }

      if (areasData) {
        setAllAreas(areasData);
      }
    } catch (e) {
      setError(e.message || "Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleCreate = async (formData) => {
    const novaIdeia = await criarIdeiaTcc(formData);
    if (novaIdeia) {
      toast.success("Ideia de TCC criada com sucesso!");
      fetchInitialData();
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingIdeia) return;
    const ideiaAtualizada = await atualizarIdeiaTcc(
      editingIdeia.id_ideia_tcc,
      formData
    );
    if (ideiaAtualizada) {
      toast.success("Ideia de TCC atualizada com sucesso!");
      setEditingIdeia(null);
      fetchInitialData();
    }
  };

  const handleDelete = async (ideiaId) => {
    toast("Tem certeza que deseja excluir esta ideia?", {
      action: {
        label: "Excluir",
        onClick: async () => {
          const result = await deletarIdeiaTcc(ideiaId);
          if (result) {
            toast.success("Ideia de TCC excluída com sucesso!");
            fetchInitialData();
          }
        },
      },
      cancel: {
        label: "Cancelar",
      },
    });
  };

  const handleStartEdit = (ideia) => {
    setEditingIdeia(ideia);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingIdeia(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
      <h1 className="text-3xl font-bold text-center">Minhas Ideias de TCC</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && (
        <>
          <IdeiaTccForm
            onSubmit={editingIdeia ? handleUpdate : handleCreate}
            initialData={editingIdeia}
            onCancel={editingIdeia ? handleCancelEdit : null}
            key={editingIdeia ? editingIdeia.id_ideia_tcc : "new"}
            allAreas={allAreas}
          />

          <hr className="my-8" />

          <h2 className="text-2xl font-bold text-center">Minhas Propostas</h2>

          {ideiasTcc.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {ideiasTcc.map((ideia) => (
                <MinhaIdeiaTccDisplay
                  key={ideia.id_ideia_tcc}
                  ideiaTcc={ideia}
                  onEdit={() => handleStartEdit(ideia)}
                  onDelete={() => handleDelete(ideia.id_ideia_tcc)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground mt-4">
              Você ainda não cadastrou nenhuma ideia de TCC.
            </p>
          )}
        </>
      )}
    </div>
  );
}
