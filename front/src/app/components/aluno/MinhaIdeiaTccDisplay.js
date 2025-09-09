"use client";
import React from "react";
import {
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
} from "@mui/material";

export default function MinhaIdeiaTccDisplay({ ideiaTcc, onEdit, onDelete }) {
  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "Submetido";
      case 1:
        return "Em avaliação";
      case 2:
        return "Aprovado";
      case 3:
        return "Rejeitado";
      default:
        return "Desconhecido";
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {ideiaTcc.titulo}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body1">{ideiaTcc.descricao}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Data de Submissão</Typography>
            <Typography>
              {new Date(ideiaTcc.data_submissao).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Status</Typography>
            <Typography>{getStatusText(ideiaTcc.status)}</Typography>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end" }}>
        {ideiaTcc.status === 0 && ( // Só permite editar se o status for "Submetido"
          <>
            <Button size="small" onClick={onEdit}>
              Editar
            </Button>
            <Button size="small" color="error" onClick={onDelete}>
              Excluir
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
}
