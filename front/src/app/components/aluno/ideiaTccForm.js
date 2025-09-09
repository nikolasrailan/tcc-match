"use client";
import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

export default function ideiaTccForm({
  onSubmit,
  initialData = null,
  onCancel = null,
}) {
  const [formData, setFormData] = useState({
    titulo: initialData?.titulo || "",
    descricao: initialData?.descricao || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {initialData ? "Editar Ideia" : "Cadastrar Nova Ideia"}
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Título da Ideia"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            fullWidth
            inputProps={{ maxLength: 45 }}
          />
          <TextField
            label="Descrição"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            required
            fullWidth
            multiline
            rows={4}
            inputProps={{ maxLength: 255 }}
          />
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}
          >
            {onCancel && (
              <Button variant="text" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained">
              {initialData ? "Salvar Alterações" : "Salvar Ideia"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
