"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getTodasIdeiasTcc } from "@/api/apiService";
import {
  Box,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
} from "@mui/material";

const IdeiaTccCard = ({ ideia }) => {
  const getStatusChip = (status) => {
    switch (status) {
      case 0:
        return <Chip label="Submetido" color="info" />;
      case 1:
        return <Chip label="Em Avaliação" color="warning" />;
      case 2:
        return <Chip label="Aprovado" color="success" />;
      case 3:
        return <Chip label="Rejeitado" color="error" />;
      default:
        return <Chip label="Desconhecido" />;
    }
  };

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {ideia.titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {ideia.descricao}
        </Typography>
        <Typography variant="caption" display="block">
          Aluno: {ideia.aluno?.dadosUsuario?.nome || "Não informado"}
        </Typography>
        <Typography variant="caption" display="block">
          Email: {ideia.aluno?.dadosUsuario?.email || "Não informado"}
        </Typography>
        <Box sx={{ mt: 2 }}>{getStatusChip(ideia.status)}</Box>
      </CardContent>
      <CardActions>
        {ideia.status === 0 && (
          <>
            <Button size="small" color="success">
              Aprovar
            </Button>
            <Button size="small" color="error">
              Rejeitar
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
};

export default function ProfessorPage() {
  useAuthRedirect();
  const [ideias, setIdeias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIdeias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTodasIdeiasTcc();
      if (data && Array.isArray(data)) {
        setIdeias(data);
      } else if (data === null) {
        setError(
          "Não foi possível carregar as ideias. Você tem permissão para ver esta página?"
        );
      }
    } catch (e) {
      setError("Ocorreu um erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeias();
  }, [fetchIdeias]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Painel do Professor - Ideias de TCC
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {ideias.length > 0 ? (
        <Grid container spacing={3}>
          {ideias.map((ideia) => (
            <Grid item xs={12} sm={6} md={4} key={ideia.id_ideia_tcc}>
              <IdeiaTccCard ideia={ideia} />
            </Grid>
          ))}
        </Grid>
      ) : (
        !error && (
          <Typography sx={{ textAlign: "center", mt: 2 }}>
            Nenhuma ideia de TCC foi submetida ainda.
          </Typography>
        )
      )}
    </Box>
  );
}
