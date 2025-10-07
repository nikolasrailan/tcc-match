"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getAreasInteresse,
  criarAreaInteresse,
  deletarAreaInteresse,
  atualizarAreaInteresse,
} from "@/api/apiService";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Modal,
  TextField,
  Alert,
} from "@mui/material";

// Estilo para o Modal
const styleModal = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

export default function AreasInteressePage() {
  useAuthRedirect();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [areaEmEdicao, setAreaEmEdicao] = useState(null);
  const [novaAreaNome, setNovaAreaNome] = useState("");
  const [error, setError] = useState("");

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    const data = await getAreasInteresse();
    if (data) {
      setAreas(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleOpenModal = () => {
    setModalOpen(true);
    setNovaAreaNome("");
    setError("");
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleOpenEditModal = (area) => {
    setAreaEmEdicao(area);
    setNovaAreaNome(area.nome);
    setEditModalOpen(true);
    setError("");
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setAreaEmEdicao(null);
    setNovaAreaNome("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!novaAreaNome.trim()) {
      setError("O nome da área não pode ser vazio.");
      return;
    }
    const result = await criarAreaInteresse({ nome: novaAreaNome });
    if (result) {
      handleCloseModal();
      fetchAreas();
    } else {
      setError("Erro ao criar área. O nome pode já existir.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!areaEmEdicao || !novaAreaNome.trim()) {
      setError("O nome da área não pode ser vazio.");
      return;
    }
    const result = await atualizarAreaInteresse(areaEmEdicao.id_area, {
      nome: novaAreaNome,
    });
    if (result) {
      handleCloseEditModal();
      fetchAreas();
    } else {
      setError("Erro ao atualizar área. O nome pode já existir.");
    }
  };

  const handleDelete = async (areaId) => {
    if (window.confirm("Tem certeza que deseja deletar esta área?")) {
      const result = await deletarAreaInteresse(areaId);
      if (result) {
        fetchAreas();
      } else {
        alert("Erro ao deletar área.");
      }
    }
  };

  if (loading && !areas.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Gerenciar Áreas de Interesse
      </Typography>
      <Button variant="contained" onClick={handleOpenModal} sx={{ mb: 3 }}>
        Adicionar Nova Área
      </Button>

      <TableContainer
        component={Paper}
        sx={{ maxWidth: "80%", margin: "auto" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome da Área</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {areas.map((area) => (
              <TableRow key={area.id_area}>
                <TableCell>{area.id_area}</TableCell>
                <TableCell>{area.nome}</TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    onClick={() => handleOpenEditModal(area)}
                    sx={{ mr: 1 }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(area.id_area)}
                  >
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={styleModal} component="form" onSubmit={handleCreate}>
          <Typography variant="h6">Criar Nova Área</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nome da Área"
            value={novaAreaNome}
            onChange={(e) => setNovaAreaNome(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained">
            Confirmar
          </Button>
        </Box>
      </Modal>

      <Modal open={editModalOpen} onClose={handleCloseEditModal}>
        <Box sx={styleModal} component="form" onSubmit={handleUpdate}>
          <Typography variant="h6">Editar Área</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Nome da Área"
            value={novaAreaNome}
            onChange={(e) => setNovaAreaNome(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained">
            Salvar Alterações
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
