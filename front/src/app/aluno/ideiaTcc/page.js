"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getMinhaIdeiaTcc,
  criarIdeiaTcc,
  deletarIdeiaTcc,
  atualizarIdeiaTcc,
} from "@/api/apiService";
import IdeiaTccForm from "@/app/components/aluno/IdeiaTccForm";
import MinhaIdeiaTccDisplay from "@/app/components/aluno/MinhaIdeiaTccDisplay";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function MinhaIdeiaPage() {
  useAuthRedirect();
  const [ideiaTcc, setIdeiaTcc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchIdeiaTcc = useCallback(async () => {
    setLoading(true);
    const data = await getMinhaIdeiaTcc();
    setIdeiaTcc(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIdeiaTcc();
  }, [fetchIdeiaTcc]);

  const handleCreate = async (formData) => {
    const novaIdeia = await criarIdeiaTcc(formData);
    if (novaIdeia) {
      alert("Ideia de TCC criada com sucesso!");
      fetchIdeiaTcc();
    }
  };

  const handleUpdate = async (formData) => {
    if (!ideiaTcc) return;
    const ideiaAtualizada = await atualizarIdeiaTcc(
      ideiaTcc.id_ideia_tcc,
      formData
    );
    if (ideiaAtualizada) {
      alert("Ideia de TCC atualizada com sucesso!");
      setIsEditing(false);
      fetchIdeiaTcc();
    }
  };

  const handleDelete = async () => {
    if (
      ideiaTcc &&
      window.confirm("Tem certeza que deseja excluir sua ideia de TCC?")
    ) {
      const result = await deletarIdeiaTcc(ideiaTcc.id_ideia_tcc);
      if (result) {
        alert("Ideia de TCC excluída com sucesso!");
        fetchIdeiaTcc();
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "800px", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Minha Ideia de TCC
      </Typography>
      {ideiaTcc ? (
        isEditing ? (
          <IdeiaTccForm
            onSubmit={handleUpdate}
            initialData={ideiaTcc}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <MinhaIdeiaTccDisplay
            ideiaTcc={ideiaTcc}
            onEdit={() => setIsEditing(true)}
            onDelete={handleDelete}
          />
        )
      ) : (
        <>
          <Typography sx={{ mb: 2 }}>
            Você ainda não cadastrou uma ideia de TCC.
          </Typography>
          <IdeiaTccForm onSubmit={handleCreate} />
        </>
      )}
    </Box>
  );
}
