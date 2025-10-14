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
import { Badge } from "@/components/ui/badge";

export default function MinhaIdeiaTccDisplay({ ideiaTcc, onEdit, onDelete }) {
  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary">Pendente</Badge>;
      case 1:
        return <Badge>Em avaliação</Badge>;
      case 2:
        return <Badge>Aprovado</Badge>;
      case 3:
        return <Badge variant="outline">Cancelado</Badge>;
      case 4:
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
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

          <Grid item xs={12}>
            <Typography variant="caption" display="block">
              Áreas de Interesse
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              {ideiaTcc.areasDeInteresse &&
              ideiaTcc.areasDeInteresse.length > 0 ? (
                ideiaTcc.areasDeInteresse.map((area) => (
                  <Badge key={area.id_area} variant="secondary">
                    {area.nome}
                  </Badge>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma área selecionada.
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="caption">Data de Submissão</Typography>
            <Typography>
              {new Date(ideiaTcc.data_submissao).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Status</Typography>
            <Typography component="div">
              {getStatusText(ideiaTcc.status)}
            </Typography>
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
