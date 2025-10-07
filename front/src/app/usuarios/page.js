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
  OutlinedInput,
} from "@mui/material";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getUsuarios,
  criarPerfil,
  deleteUsuario,
  updateUsuario,
  deleteAlunoProfile,
  deleteProfessorProfile,
  getCursos,
  getAreasInteresse,
} from "@/api/apiService";
import Link from "next/link";

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
  useAuthRedirect();
  const [usuarios, setUsuarios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [tipoPerfil, setTipoPerfil] = useState("");
  const [dadosPerfil, setDadosPerfil] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [userData, cursoData, areaData] = await Promise.all([
      getUsuarios(),
      getCursos(),
      getAreasInteresse(),
    ]);
    if (userData) setUsuarios(userData);
    if (cursoData) setCursos(cursoData);
    if (areaData) setAreas(areaData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (usuario, tipo) => {
    setUsuarioSelecionado(usuario);
    setTipoPerfil(tipo);
    setDadosPerfil(
      tipo === "aluno"
        ? { matricula: "", id_curso: "", id_usuario: usuario.id_usuario }
        : {
            disponibilidade: 1,
            areasDeInteresse: [],
            id_usuario: usuario.id_usuario,
          }
    );
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setUsuarioSelecionado(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDadosPerfil((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    const result = await criarPerfil(tipoPerfil, dadosPerfil);
    if (result) {
      setSuccess(`${tipoPerfil} criado com sucesso!`);
      handleCloseModal();
      fetchData();
    } else {
      setError(`Erro ao criar perfil de ${tipoPerfil}.`);
    }
  };

  // ... (outras funções de handle)

  const getStatusChip = (usuario) => {
    if (usuario.isAdmin) return <Chip label="Admin" color="secondary" />;
    if (usuario.dadosProfessor)
      return <Chip label="Professor" color="primary" />;
    if (usuario.dadosAluno) return <Chip label="Aluno" color="success" />;
    return <Chip label="Nenhum" variant="outlined" />;
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box
      sx={{
        p: 3,
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Painel de Gerenciamento de Usuários
      </Typography>

      {/* Modais aqui... */}
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
                onChange={handleInputChange}
                required
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel id="curso-label">Curso</InputLabel>
                <Select
                  labelId="curso-label"
                  name="id_curso"
                  value={dadosPerfil.id_curso || ""}
                  label="Curso"
                  onChange={handleInputChange}
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
            <FormControl fullWidth>
              <InputLabel id="areas-label">Áreas de Interesse</InputLabel>
              <Select
                labelId="areas-label"
                name="areasDeInteresse"
                multiple
                value={dadosPerfil.areasDeInteresse || []}
                onChange={handleInputChange}
                input={<OutlinedInput label="Áreas de Interesse" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const area = areas.find((a) => a.id_area === value);
                      return <Chip key={value} label={area ? area.nome : ""} />;
                    })}
                  </Box>
                )}
              >
                {areas.map((area) => (
                  <MenuItem key={area.id_area} value={area.id_area}>
                    {area.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button type="submit" variant="contained">
            Confirmar
          </Button>
        </Box>
      </Modal>

      <TableContainer
        component={Paper}
        sx={{ maxWidth: "90%", margin: "auto" }}
      >
        <Table>
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
                    {/* Outros botões de ação */}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
