"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getCursos,
  criarCurso,
  deletarCurso,
  atualizarCurso,
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

export default function CursosPage() {
  useAuthRedirect();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cursoEmEdicao, setCursoEmEdicao] = useState(null);
  const [novoCursoNome, setNovoCursoNome] = useState("");
  const [error, setError] = useState("");

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    const data = await getCursos();
    if (data) {
      setCursos(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  const handleOpenModal = () => {
    setModalOpen(true);
    setNovoCursoNome("");
    setError("");
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleOpenEditModal = (curso) => {
    setCursoEmEdicao(curso);
    setNovoCursoNome(curso.nome);
    setEditModalOpen(true);
    setError("");
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setCursoEmEdicao(null);
    setNovoCursoNome("");
  };

  const handleCreateCurso = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!novoCursoNome.trim()) {
      setError("O nome do curso não pode ser vazio.");
      setLoading(false);
      return;
    }

    const result = await criarCurso({ nome: novoCursoNome });
    if (result) {
      alert("Curso criado com sucesso!");
      handleCloseModal();
      fetchCursos();
    } else {
      setError("Erro ao criar curso. O nome pode já existir.");
    }
    setLoading(false);
  };

  const handleUpdateCurso = async (e) => {
    e.preventDefault();
    if (!cursoEmEdicao) return;
    setLoading(true);
    setError("");

    if (!novoCursoNome.trim()) {
      setError("O nome do curso não pode ser vazio.");
      setLoading(false);
      return;
    }

    const result = await atualizarCurso(cursoEmEdicao.id_curso, {
      nome: novoCursoNome,
    });
    if (result) {
      handleCloseEditModal();
      fetchCursos();
    } else {
      setError("Erro ao atualizar curso. O nome pode já existir.");
    }
    setLoading(false);
  };

  const handleDeleteCurso = async (cursoId) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este curso? Esta ação não pode ser desfeita e removerá alunos associados."
    );
    if (confirmed) {
      const result = await deletarCurso(cursoId);
      if (result) {
        alert("Curso deletado com sucesso!");
        fetchCursos();
      } else {
        alert("Erro ao deletar curso.");
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
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Gerenciar Cursos
      </Typography>
      <Button variant="contained" onClick={handleOpenModal} sx={{ mb: 3 }}>
        Adicionar Novo Curso
      </Button>

      <TableContainer
        component={Paper}
        sx={{ maxWidth: "80%", margin: "auto" }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="tabela de cursos">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome do Curso</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cursos.map((curso) => (
              <TableRow key={curso.id_curso}>
                <TableCell>{curso.id_curso}</TableCell>
                <TableCell>{curso.nome}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={() => handleOpenEditModal(curso)}
                    sx={{ mr: 1 }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleDeleteCurso(curso.id_curso)}
                  >
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para criar curso */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={styleModal} component="form" onSubmit={handleCreateCurso}>
          <Typography variant="h6">Criar Novo Curso</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            name="nome"
            label="Nome do Curso"
            onChange={(e) => setNovoCursoNome(e.target.value)}
            value={novoCursoNome}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Criando..." : "Confirmar"}
          </Button>
        </Box>
      </Modal>

      {/* Modal para editar curso */}
      <Modal open={editModalOpen} onClose={handleCloseEditModal}>
        <Box sx={styleModal} component="form" onSubmit={handleUpdateCurso}>
          <Typography variant="h6">Editar Curso</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            name="nome"
            label="Nome do Curso"
            onChange={(e) => setNovoCursoNome(e.target.value)}
            value={novoCursoNome}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
