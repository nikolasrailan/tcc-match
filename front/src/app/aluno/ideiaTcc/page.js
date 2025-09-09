"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getMinhaIdeiaTcc,
  criarIdeiaTcc,
  deletarIdeiaTcc,
  atualizarIdeiaTcc,
} from "@/api/apiService";
import IdeiaTccForm from "@/app/components/aluno/ideiaTccForm";
import MinhaIdeiaTccDisplay from "@/app/components/aluno/MinhaIdeiaTccDisplay";
import {
  Box,
  CircularProgress,
  Typography,
  Grid,
  Divider,
} from "@mui/material";

export default function MinhasIdeiasPage() {
  useAuthRedirect();
  const [ideiasTcc, setIdeiasTcc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIdeia, setEditingIdeia] = useState(null);

  const fetchIdeiasTcc = useCallback(async () => {
    setLoading(true);
    const data = await getMinhaIdeiaTcc();
    if (data && Array.isArray(data)) {
      setIdeiasTcc(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeiasTcc();
  }, [fetchIdeiasTcc]);

  const handleCreate = async (formData) => {
    const novaIdeia = await criarIdeiaTcc(formData);
    if (novaIdeia) {
      alert("Ideia de TCC criada com sucesso!");
      fetchIdeiasTcc(); // Recarrega a lista
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
      setEditingIdeia(null); // Sai do modo de edição
      fetchIdeiasTcc(); // Recarrega a lista
    }
  };

  const handleDelete = async (ideiaId) => {
    if (window.confirm("Tem certeza que deseja excluir esta ideia de TCC?")) {
      const result = await deletarIdeiaTcc(ideiaId);
      if (result) {
        alert("Ideia de TCC excluída com sucesso!");
        fetchIdeiasTcc(); // Recarrega a lista
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
      <Typography variant="h4" gutterBottom>
        {editingIdeia ? "Editando Ideia" : "Cadastrar Nova Ideia"}
      </Typography>

      <IdeiaTccForm
        onSubmit={editingIdeia ? handleUpdate : handleCreate}
        initialData={editingIdeia}
        onCancel={editingIdeia ? handleCancelEdit : null}
        key={editingIdeia ? editingIdeia.id_ideia_tcc : "new"}
      />

      <Divider sx={{ my: 4 }}>
        <Typography variant="h5">Minhas Ideias Cadastradas</Typography>
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
    </Box>
  );
}
