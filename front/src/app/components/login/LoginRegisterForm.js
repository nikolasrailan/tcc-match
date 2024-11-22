"use client";
import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Box,
} from "@mui/material";

export default function LoginRegisterForm({ onSubmit }) {
  const [formData, setFormData] = useState({ nome: "", email: "", senha: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card sx={{ maxWidth: 400, margin: "auto", mt: 5, p: 2 }}>
      <CardContent>
        <Typography variant="h4" sx={{ mb: 2 }} align="center">
          Registre-se
        </Typography>
        <Box
          component="form"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          onSubmit={handleSubmit}
        >
          <TextField
            id="nome"
            label="Nome"
            variant="outlined"
            fullWidth
            value={formData.nome}
            onChange={handleChange}
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            id="senha"
            label="Senha"
            type="password"
            variant="outlined"
            fullWidth
            value={formData.senha}
            onChange={handleChange}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
          >
            Criar Conta
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
