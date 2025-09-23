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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getUsuarios,
  criarPerfil,
  deleteUsuario,
  updateUsuario,
  deleteAlunoProfile,
  deleteProfessorProfile,
  getCursos, // Importa o novo serviço de API para cursos
} from "@/api/apiService";
import Link from "next/link";

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
  const [cursos, setCursos] = useState([]); // Novo estado para os cursos
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [tipoPerfil, setTipoPerfil] = useState(""); // 'aluno' ou 'professor'
  const [dadosPerfil, setDadosPerfil] = useState({});
  const [dadosEdicao, setDadosEdicao] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    const data = await getUsuarios();
    if (data) {
      setUsuarios(data);
    }
    setLoading(false);
  }, []);

  const fetchCursos = useCallback(async () => {
    const data = await getCursos();
    if (data) {
      setCursos(data);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
    fetchCursos();
  }, [fetchUsuarios, fetchCursos]);

  const handleOpenModal = (usuario, tipo) => {
    setUsuarioSelecionado(usuario);
    setTipoPerfil(tipo);
    setDadosPerfil(
      tipo === "aluno"
        ? { matricula: "", id_curso: "", id_usuario: usuario.id_usuario }
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
    setDadosEdicao({
      nome: usuario.nome || "",
      email: usuario.email || "",
      matricula: usuario.dadosAluno?.matricula || "",
      // Agora armazena o ID do curso, não o nome
      id_curso: usuario.dadosAluno?.cursoInfo?.id_curso || "",
      especializacao: usuario.dadosProfessor?.especializacao || "",
      disponibilidade:
        usuario.dadosProfessor?.disponibilidade !== undefined
          ? String(Number(usuario.dadosProfessor.disponibilidade))
          : "",
    });
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
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const dadosParaEnvio =
      tipoPerfil === "aluno"
        ? {
            ...dadosPerfil,
            id_curso: parseInt(dadosPerfil.id_curso),
          }
        : dadosPerfil;

    const result = await criarPerfil(tipoPerfil, dadosParaEnvio);

    setLoading(false);
    if (result) {
      setSuccess(
        `${
          tipoPerfil.charAt(0).toUpperCase() + tipoPerfil.slice(1)
        } criado com sucesso!`
      );
      handleCloseModal();
      fetchUsuarios();
    } else {
      setError(`Erro ao criar perfil de ${tipoPerfil}.`);
    }
  };

  const handleSubmitEditModal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (!usuarioSelecionado) return;

    // Converte disponibilidade para o formato booleano
    const dadosParaEnvio = {
      ...dadosEdicao,
      disponibilidade: dadosEdicao.disponibilidade === "1",
    };

    const result = await updateUsuario(
      usuarioSelecionado.id_usuario,
      dadosParaEnvio
    );
    setLoading(false);

    if (result) {
      setSuccess("Usuário atualizado com sucesso!");
      handleCloseEditModal();
      fetchUsuarios();
    } else {
      setError("Ocorreu um erro ao atualizar o usuário.");
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

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button variant="contained" component={Link} href="/cursos">
          Gerenciar Cursos
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

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
              {/* Dropdown para selecionar o curso */}
              <FormControl fullWidth required>
                <InputLabel id="curso-label">Curso</InputLabel>
                <Select
                  labelId="curso-label"
                  name="id_curso"
                  value={dadosPerfil.id_curso}
                  label="Curso"
                  onChange={(e) => handleInputChange(e, setDadosPerfil)}
                >
                  {cursos.map((curso) => (
                    <MenuItem key={curso.id_curso} value={curso.id_curso}>
                      {curso.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

          {/* Campos para Aluno */}
          {usuarioSelecionado?.dadosAluno && (
            <>
              <TextField
                name="matricula"
                label="Matrícula"
                value={dadosEdicao.matricula || ""}
                onChange={(e) => handleInputChange(e, setDadosEdicao)}
                fullWidth
              />
              {/* Dropdown para selecionar o curso */}
              <FormControl fullWidth required>
                <InputLabel id="curso-label">Curso</InputLabel>
                <Select
                  labelId="curso-label"
                  name="id_curso"
                  value={dadosEdicao.id_curso || ""}
                  label="Curso"
                  onChange={(e) => handleInputChange(e, setDadosEdicao)}
                >
                  {cursos.map((curso) => (
                    <MenuItem key={curso.id_curso} value={curso.id_curso}>
                      {curso.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          {/* Campos para Professor */}
          {usuarioSelecionado?.dadosProfessor && (
            <>
              <TextField
                name="especializacao"
                label="Especialização"
                value={dadosEdicao.especializacao || ""}
                onChange={(e) => handleInputChange(e, setDadosEdicao)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="disponibilidade-label">
                  Disponibilidade
                </InputLabel>
                <Select
                  labelId="disponibilidade-label"
                  name="disponibilidade"
                  value={dadosEdicao.disponibilidade}
                  label="Disponibilidade"
                  onChange={(e) => handleInputChange(e, setDadosEdicao)}
                >
                  <MenuItem value={"1"}>Disponível</MenuItem>
                  <MenuItem value={"0"}>Indisponível</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

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
