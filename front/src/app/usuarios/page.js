"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Button,
  Box,
  CircularProgress,
  Modal,
  TextField,
} from "@mui/material";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getUsuarios,
  criarPerfil,
  deleteUsuario,
  updateUsuario,
  deleteAlunoProfile,
  deleteProfessorProfile,
} from "@/api/apiService";

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

export default function UsuariosPage() {
  useAuthRedirect(); // Protege a rota
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [tipoPerfil, setTipoPerfil] = useState(""); // 'aluno' ou 'professor'
  const [dadosPerfil, setDadosPerfil] = useState({});
  const [dadosEdicao, setDadosEdicao] = useState({});

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    const data = await getUsuarios();
    if (data) {
      setUsuarios(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleOpenModal = (usuario, tipo) => {
    setUsuarioSelecionado(usuario);
    setTipoPerfil(tipo);
    setDadosPerfil(
      tipo === "aluno"
        ? { matricula: "", curso: "", id_usuario: usuario.id_usuario }
        : {
            disponibilidade: 1,
            especializacao: "",
            id_usuario: usuario.id_usuario,
          }
    );
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setUsuarioSelecionado(null);
    setDadosPerfil({});
  };

  const handleOpenEditModal = (usuario) => {
    setUsuarioSelecionado(usuario);
    setDadosEdicao({ nome: usuario.nome, email: usuario.email });
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setUsuarioSelecionado(null);
    setDadosEdicao({});
  };

  const handleOpenDeleteModal = (usuario) => {
    setUsuarioSelecionado(usuario);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setUsuarioSelecionado(null);
  };

  const handleInputChange = (e, setData) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    const sucesso = await criarPerfil(tipoPerfil, dadosPerfil);
    if (sucesso) {
      alert(
        `${
          tipoPerfil.charAt(0).toUpperCase() + tipoPerfil.slice(1)
        } criado com sucesso!`
      );
      handleCloseModal();
      fetchUsuarios(); // Atualiza a lista de usuários
    }
  };

  const handleSubmitEditModal = async (e) => {
    e.preventDefault();
    if (!usuarioSelecionado) return;
    const sucesso = await updateUsuario(
      usuarioSelecionado.id_usuario,
      dadosEdicao
    );
    if (sucesso) {
      alert("Usuário atualizado com sucesso!");
      handleCloseEditModal();
      fetchUsuarios();
    }
  };

  const handleConfirmDelete = async () => {
    if (!usuarioSelecionado) return;
    const sucesso = await deleteUsuario(usuarioSelecionado.id_usuario);
    if (sucesso) {
      alert("Usuário desativado com sucesso!");
      handleCloseDeleteModal();
      fetchUsuarios();
    }
  };

  const handleRemoveProfile = async (usuario) => {
    let sucesso = false;
    if (usuario.dadosAluno) {
      sucesso = await deleteAlunoProfile(usuario.dadosAluno.id_aluno);
    } else if (usuario.dadosProfessor) {
      sucesso = await deleteProfessorProfile(
        usuario.dadosProfessor.id_professor
      );
    }

    if (sucesso) {
      alert("Perfil removido com sucesso!");
      fetchUsuarios();
    }
  };

  const getStatusChip = (usuario) => {
    if (usuario.isAdmin) return <Chip label="Admin" color="secondary" />;
    if (usuario.dadosProfessor)
      return <Chip label="Professor" color="primary" />;
    if (usuario.dadosAluno) return <Chip label="Aluno" color="success" />;
    return <Chip label="Nenhum" variant="outlined" />;
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
        Painel de Gerenciamento de Usuários
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ maxWidth: "80%", margin: "auto" }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="tabela de usuarios">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id_usuario}>
                <TableCell>{usuario.id_usuario}</TableCell>
                <TableCell>{usuario.nome}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{getStatusChip(usuario)}</TableCell>
                <TableCell align="center">
                  <Box
                    sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                  >
                    {!usuario.dadosProfessor &&
                      !usuario.dadosAluno &&
                      !usuario.isAdmin && (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenModal(usuario, "aluno")}
                          >
                            Tornar Aluno
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            color="info"
                            onClick={() =>
                              handleOpenModal(usuario, "professor")
                            }
                          >
                            Tornar Prof.
                          </Button>
                        </>
                      )}
                    {(usuario.dadosAluno || usuario.dadosProfessor) &&
                      !usuario.isAdmin && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          onClick={() => handleRemoveProfile(usuario)}
                        >
                          Rem. Perfil
                        </Button>
                      )}
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditModal(usuario)}
                    >
                      Editar
                    </Button>
                    {!usuario.isAdmin && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteModal(usuario)}
                      >
                        Excluir
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para criar perfil */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={styleModal} component="form" onSubmit={handleSubmitModal}>
          <Typography variant="h6">
            Tornar {usuarioSelecionado?.nome} um {tipoPerfil}
          </Typography>
          {tipoPerfil === "aluno" ? (
            <>
              <TextField
                name="matricula"
                label="Matrícula"
                onChange={(e) => handleInputChange(e, setDadosPerfil)}
                required
                fullWidth
              />
              <TextField
                name="curso"
                label="Curso"
                onChange={(e) => handleInputChange(e, setDadosPerfil)}
                required
                fullWidth
              />
            </>
          ) : (
            <TextField
              name="especializacao"
              label="Especialização"
              onChange={(e) => handleInputChange(e, setDadosPerfil)}
              required
              fullWidth
            />
          )}
          <Button type="submit" variant="contained">
            Confirmar
          </Button>
        </Box>
      </Modal>

      {/* Modal para editar usuário */}
      <Modal open={editModalOpen} onClose={handleCloseEditModal}>
        <Box sx={styleModal} component="form" onSubmit={handleSubmitEditModal}>
          <Typography variant="h6">
            Editar Usuário: {usuarioSelecionado?.nome}
          </Typography>
          <TextField
            name="nome"
            label="Nome"
            value={dadosEdicao.nome || ""}
            onChange={(e) => handleInputChange(e, setDadosEdicao)}
            required
            fullWidth
          />
          <TextField
            name="email"
            label="Email"
            type="email"
            value={dadosEdicao.email || ""}
            onChange={(e) => handleInputChange(e, setDadosEdicao)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained">
            Salvar Alterações
          </Button>
        </Box>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal open={deleteModalOpen} onClose={handleCloseDeleteModal}>
        <Box sx={styleModal}>
          <Typography variant="h6">Confirmar Exclusão</Typography>
          <Typography>
            Tem certeza que deseja desativar a conta de{" "}
            {usuarioSelecionado?.nome}? Esta ação não pode ser desfeita.
          </Typography>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <Button variant="text" onClick={handleCloseDeleteModal}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
            >
              Confirmar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
