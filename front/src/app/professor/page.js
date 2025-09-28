"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getSolicitacoesProfessor,
  responderSolicitacao,
} from "@/api/apiService";
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

const SolicitacaoCard = ({ solicitacao, onResponder }) => {
  const getStatusChip = (status) => {
    switch (status) {
      case 0:
        return <Chip label="Pendente" color="warning" />;
      case 1:
        return <Chip label="Aceito" color="success" />;
      case 2:
        return <Chip label="Rejeitado" color="error" />;
      case 3:
        return <Chip label="Cancelada" />;
      default:
        return <Chip label="Desconhecido" />;
    }
  };

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {solicitacao.ideiaTcc.titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {solicitacao.ideiaTcc.descricao}
        </Typography>
        <Typography variant="caption" display="block">
          Aluno: {solicitacao.aluno?.dadosUsuario?.nome || "Não informado"}
        </Typography>
        <Typography variant="caption" display="block">
          Email: {solicitacao.aluno?.dadosUsuario?.email || "Não informado"}
        </Typography>
        <Box sx={{ mt: 2 }}>{getStatusChip(solicitacao.status)}</Box>
      </CardContent>
      <CardActions>
        {solicitacao.status === 0 && (
          <>
            <Button
              size="small"
              color="success"
              onClick={() => onResponder(solicitacao.id_solicitacao, true)}
            >
              Aprovar
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => onResponder(solicitacao.id_solicitacao, false)}
            >
              Rejeitar
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
};

export default function ProfessorPainelPage() {
  useAuthRedirect();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSolicitacoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSolicitacoesProfessor();
      if (data && Array.isArray(data)) {
        setSolicitacoes(data);
      } else if (data === null) {
        setError(
          "Não foi possível carregar as solicitações. Você tem permissão para ver esta página?"
        );
      }
    } catch (e) {
      setError("Ocorreu um erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  const handleResponder = async (id, aceito) => {
    const result = await responderSolicitacao(id, aceito);
    if (result) {
      fetchSolicitacoes();
    } else {
      setError("Ocorreu um erro ao responder à solicitação.");
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
    <Box sx={{ p: 3, maxWidth: "1200px", margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Painel do Professor - Solicitações de Orientação
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {solicitacoes.length > 0 ? (
        <Grid container spacing={3}>
          {solicitacoes.map((solicitacao) => (
            <Grid item xs={12} sm={6} md={4} key={solicitacao.id_solicitacao}>
              <SolicitacaoCard
                solicitacao={solicitacao}
                onResponder={handleResponder}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        !error && (
          <Typography sx={{ textAlign: "center", mt: 2 }}>
            Nenhuma solicitação de orientação foi recebida ainda.
          </Typography>
        )
      )}
    </Box>
  );
}
