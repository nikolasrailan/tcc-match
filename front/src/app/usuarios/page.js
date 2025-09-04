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

// Função para buscar os usuários da API
async function getUsuarios(token) {
  try {
    const response = await fetch("http://localhost:8000/usuarios", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Erro ao buscar usuários. Verifique sua autorização.");
    }
    return await response.json();
  } catch (error) {
    console.error("Erro na requisição de usuários:", error);
    alert(error.message);
    return [];
  }
}

// Funções para criar professor/aluno
async function criarPerfil(tipo, dados, token) {
  const endpoint = tipo === "professor" ? "/professores" : "/alunos";
  try {
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.error || `Erro ao criar ${tipo}.`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao criar ${tipo}:`, error);
    alert(error.message);
    return null;
  }
}

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
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [tipoPerfil, setTipoPerfil] = useState(""); // 'aluno' ou 'professor'
  const [dadosPerfil, setDadosPerfil] = useState({});

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (token) {
      const data = await getUsuarios(token);
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
    if (tipo === "aluno") {
      setDadosPerfil({
        matricula: "",
        curso: "",
        id_usuario: usuario.id_usuario,
      });
    } else {
      setDadosPerfil({
        disponibilidade: 1,
        especializacao: "",
        id_usuario: usuario.id_usuario,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setUsuarioSelecionado(null);
    setDadosPerfil({});
  };

  const handleInputChange = (e) => {
    setDadosPerfil({ ...dadosPerfil, [e.target.name]: e.target.value });
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const sucesso = await criarPerfil(tipoPerfil, dadosPerfil, token);
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

  const getStatusChip = (usuario) => {
    if (usuario.isAdmin) {
      return <Chip label="Admin" color="secondary" />;
    }
    if (usuario.dadosProfessor) {
      return <Chip label="Professor" color="primary" />;
    }
    if (usuario.dadosAluno) {
      return <Chip label="Aluno" color="success" />;
    }
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Painel de Gerenciamento de Usuários
      </Typography>
      <TableContainer component={Paper}>
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
                  {!usuario.dadosProfessor &&
                    !usuario.dadosAluno &&
                    !usuario.isAdmin && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
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
                          color="secondary"
                          onClick={() => handleOpenModal(usuario, "professor")}
                        >
                          Tornar Professor
                        </Button>
                      </Box>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
      >
        <Box sx={styleModal} component="form" onSubmit={handleSubmitModal}>
          <Typography id="modal-title" variant="h6" component="h2">
            Tornar {usuarioSelecionado?.nome} um {tipoPerfil}
          </Typography>
          {tipoPerfil === "aluno" ? (
            <>
              <TextField
                name="matricula"
                label="Matrícula"
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="curso"
                label="Curso"
                onChange={handleInputChange}
                required
                fullWidth
              />
            </>
          ) : (
            <>
              <TextField
                name="especializacao"
                label="Especialização"
                onChange={handleInputChange}
                required
                fullWidth
              />
              {/* O campo disponibilidade está fixo como 1 (disponível) por simplicidade */}
            </>
          )}
          <Button type="submit" variant="contained">
            Confirmar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
