"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getMinhaIdeiaTcc,
  criarIdeiaTcc,
  deletarIdeiaTcc,
  atualizarIdeiaTcc,
  getAreasInteresse, // Importar a função
} from "@/api/apiService";
import IdeiaTccForm from "@/app/components/aluno/ideiaTccForm";
import MinhaIdeiaTccDisplay from "@/app/components/aluno/MinhaIdeiaTccDisplay";
import {
  Box,
  CircularProgress,
  Typography,
  Grid,
  Divider,
  Alert,
} from "@mui/material";
import { Button } from "@/components/ui/button";

export default function AlunoPage() {
  useAuthRedirect();
  const [ideiasTcc, setIdeiasTcc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIdeia, setEditingIdeia] = useState(null);
  const [error, setError] = useState(null);
  const [allAreas, setAllAreas] = useState([]); // Estado para as áreas

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
      alert("Ideia de TCC criada com sucesso!");
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
      alert("Ideia de TCC atualizada com sucesso!");
      setEditingIdeia(null);
      fetchInitialData();
    }
  };

  const handleDelete = async (ideiaId) => {
    const confirmed = true;
    if (confirmed) {
      const result = await deletarIdeiaTcc(ideiaId);
      if (result) {
        alert("Ideia de TCC excluída com sucesso!");
        fetchInitialData();
      }
    }
  };

  const handleStartEdit = (ideia) => {
    setEditingIdeia(ideia);
  };

  const handleCancelEdit = () => {
    setEditingIdeia(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "900px", margin: "auto" }}>
      <div>
        <Button>Click me</Button>
      </div>
      <Typography variant="h4" gutterBottom>
        Minhas Ideias de TCC
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!error && (
        <>
          <IdeiaTccForm
            onSubmit={editingIdeia ? handleUpdate : handleCreate}
            initialData={editingIdeia}
            onCancel={editingIdeia ? handleCancelEdit : null}
            key={editingIdeia ? editingIdeia.id_ideia_tcc : "new"}
            allAreas={allAreas} // Passar as áreas para o formulário
          />

          <Divider sx={{ my: 4 }}>
            <Typography variant="h5">Minhas Propostas</Typography>
          </Divider>

          {ideiasTcc.length > 0 ? (
            <Grid container spacing={3}>
              {ideiasTcc.map((ideia) => (
                <Grid item xs={12} md={6} key={ideia.id_ideia_tcc}>
                  <MinhaIdeiaTccDisplay
                    ideiaTcc={ideia}
                    onEdit={() => handleStartEdit(ideia)}
                    onDelete={() => handleDelete(ideia.id_ideia_tcc)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography sx={{ textAlign: "center", mt: 2 }}>
              Você ainda não cadastrou nenhuma ideia de TCC.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
