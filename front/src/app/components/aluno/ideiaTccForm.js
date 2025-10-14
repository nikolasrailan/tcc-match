"use client";
import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
} from "@mui/material";

export default function IdeiaTccForm({
  onSubmit,
  initialData = null,
  onCancel = null,
  allAreas = [],
}) {
  const [formData, setFormData] = useState({
    titulo: initialData?.titulo || "",
    descricao: initialData?.descricao || "",
    areasDeInteresse:
      initialData?.areasDeInteresse?.map((a) => a.id_area) || [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

          <FormControl fullWidth>
            <InputLabel id="areas-interesse-label">
              Áreas de Interesse
            </InputLabel>
            <Select
              labelId="areas-interesse-label"
              name="areasDeInteresse"
              multiple
              value={formData.areasDeInteresse}
              onChange={handleChange}
              input={<OutlinedInput label="Áreas de Interesse" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const area = allAreas.find((a) => a.id_area === value);
                    return <Chip key={value} label={area ? area.nome : ""} />;
                  })}
                </Box>
              )}
            >
              {allAreas.map((area) => (
                <MenuItem key={area.id_area} value={area.id_area}>
                  {area.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
