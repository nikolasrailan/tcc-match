"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  Trash2,
  Edit,
  UserPlus,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

export default function UsuariosPage() {
  useAuthRedirect(); // Protege a rota
  const [usuarios, setUsuarios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for modals
  const [modalState, setModalState] = useState({ type: null, user: null });

  // State for forms
  const [dadosPerfil, setDadosPerfil] = useState({});
  const [dadosEdicao, setDadosEdicao] = useState({});

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

  const openModal = (type, user) => {
    setError(null);
    setSuccess(null);
    setModalState({ type, user });

    if (type === "editar") {
      setDadosEdicao({
        nome: user.nome || "",
        email: user.email || "",
        matricula: user.dadosAluno?.matricula || "",
        id_curso: user.dadosAluno?.cursoInfo?.id_curso || "",
        areasDeInteresse:
          user.dadosProfessor?.areasDeInteresse?.map((a) => a.id_area) || [],
        disponibilidade: user.dadosProfessor?.disponibilidade ? "1" : "0",
        limite_orientacoes: user.dadosProfessor?.limite_orientacoes || 5,
      });
    } else if (type === "tornarAluno") {
      setDadosPerfil({
        matricula: "",
        id_curso: "",
        id_usuario: user.id_usuario,
      });
    } else if (type === "tornarProfessor") {
      setDadosPerfil({
        disponibilidade: 1,
        areasDeInteresse: [],
        id_usuario: user.id_usuario,
        limite_orientacoes: 5,
      });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, user: null });
  };

  const handleInputChange = (e, setData) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value, name, setData) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAreaChange = (areaId) => {
    setDadosEdicao((prev) => {
      const newAreas = prev.areasDeInteresse.includes(areaId)
        ? prev.areasDeInteresse.filter((id) => id !== areaId)
        : [...prev.areasDeInteresse, areaId];
      return { ...prev, areasDeInteresse: newAreas };
    });
  };

  const handleSubmitPerfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await criarPerfil(
      modalState.type === "tornarAluno" ? "aluno" : "professor",
      dadosPerfil
    );

    setLoading(false);
    if (result) {
      setSuccess(`Perfil criado com sucesso!`);
      closeModal();
      fetchData();
    } else {
      setError(`Erro ao criar perfil.`);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const dataToUpdate = {
      ...dadosEdicao,
      disponibilidade: dadosEdicao.disponibilidade === "1" ? 1 : 0,
    };

    const result = await updateUsuario(
      modalState.user.id_usuario,
      dataToUpdate
    );
    setLoading(false);

    if (result) {
      setSuccess("Usuário atualizado com sucesso!");
      closeModal();
      fetchData();
    } else {
      setError("Ocorreu um erro ao atualizar o usuário.");
    }
  };

  const handleConfirmDelete = async () => {
    const result = await deleteUsuario(modalState.user.id_usuario);
    if (result) {
      setSuccess("Usuário desativado com sucesso!");
      closeModal();
      fetchData();
    } else {
      setError("Erro ao desativar usuário.");
      closeModal();
    }
  };

  const handleRemoveProfile = async (usuario) => {
    let success = false;
    const profileType = usuario.dadosAluno ? "aluno" : "professor";
    if (
      confirm(
        `Tem certeza que deseja remover o perfil de ${profileType} de ${usuario.nome}?`
      )
    ) {
      if (usuario.dadosAluno) {
        success = await deleteAlunoProfile(usuario.dadosAluno.id_aluno);
      } else if (usuario.dadosProfessor) {
        success = await deleteProfessorProfile(
          usuario.dadosProfessor.id_professor
        );
      }

      if (success) {
        setSuccess("Perfil removido com sucesso!");
        fetchData();
      } else {
        setError("Erro ao remover perfil.");
      }
    }
  };

  const getStatusBadge = (usuario) => {
    if (usuario.isAdmin) return <Badge variant="destructive">Admin</Badge>;
    if (usuario.dadosProfessor)
      return <Badge variant="secondary">Professor</Badge>;
    if (usuario.dadosAluno) return <Badge>Aluno</Badge>;
    return <Badge variant="outline">Sem Perfil</Badge>;
  };

  if (loading && usuarios.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <Button asChild>
          <Link href="/usuarios/criar">
            <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id_usuario}>
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{getStatusBadge(usuario)}</TableCell>
                <TableCell className="text-right space-x-2">
                  {!usuario.dadosProfessor &&
                    !usuario.dadosAluno &&
                    !usuario.isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal("tornarAluno", usuario)}
                        >
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Tornar Aluno
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal("tornarProfessor", usuario)}
                        >
                          <Briefcase className="mr-2 h-4 w-4" />
                          Tornar Prof.
                        </Button>
                      </>
                    )}
                  {(usuario.dadosAluno || usuario.dadosProfessor) &&
                    !usuario.isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProfile(usuario)}
                      >
                        Rem. Perfil
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal("editar", usuario)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  {!usuario.isAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openModal("excluir", usuario)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --- DIALOGS --- */}

      {/* Criar Perfil Aluno/Professor */}
      <Dialog
        open={
          modalState.type === "tornarAluno" ||
          modalState.type === "tornarProfessor"
        }
        onOpenChange={closeModal}
      >
        <DialogContent>
          <form onSubmit={handleSubmitPerfil}>
            <DialogHeader>
              <DialogTitle>
                Tornar {modalState.user?.nome} um{" "}
                {modalState.type === "tornarAluno" ? "Aluno" : "Professor"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {modalState.type === "tornarAluno" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      name="matricula"
                      onChange={(e) => handleInputChange(e, setDadosPerfil)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Select
                      name="id_curso"
                      onValueChange={(value) =>
                        handleSelectChange(value, "id_curso", setDadosPerfil)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {cursos.map((curso) => (
                          <SelectItem
                            key={curso.id_curso}
                            value={curso.id_curso}
                          >
                            {curso.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Áreas de Interesse</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {dadosPerfil.areasDeInteresse?.length > 0
                          ? `${dadosPerfil.areasDeInteresse.length} áreas selecionadas`
                          : "Selecione as áreas"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                      {areas.map((area) => (
                        <DropdownMenuCheckboxItem
                          key={area.id_area}
                          checked={dadosPerfil.areasDeInteresse?.includes(
                            area.id_area
                          )}
                          onCheckedChange={() => {
                            const currentAreas =
                              dadosPerfil.areasDeInteresse || [];
                            const newAreas = currentAreas.includes(area.id_area)
                              ? currentAreas.filter((id) => id !== area.id_area)
                              : [...currentAreas, area.id_area];
                            setDadosPerfil((prev) => ({
                              ...prev,
                              areasDeInteresse: newAreas,
                            }));
                          }}
                        >
                          {area.nome}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar Usuário */}
      <Dialog open={modalState.type === "editar"} onOpenChange={closeModal}>
        <DialogContent>
          <form onSubmit={handleSubmitEdit}>
            <DialogHeader>
              <DialogTitle>Editar Usuário: {modalState.user?.nome}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="nome-edit">Nome</Label>
                <Input
                  id="nome-edit"
                  name="nome"
                  value={dadosEdicao.nome || ""}
                  onChange={(e) => handleInputChange(e, setDadosEdicao)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-edit">Email</Label>
                <Input
                  id="email-edit"
                  name="email"
                  type="email"
                  value={dadosEdicao.email || ""}
                  onChange={(e) => handleInputChange(e, setDadosEdicao)}
                  required
                />
              </div>
              {modalState.user?.dadosAluno && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="matricula-edit">Matrícula</Label>
                    <Input
                      id="matricula-edit"
                      name="matricula"
                      value={dadosEdicao.matricula || ""}
                      onChange={(e) => handleInputChange(e, setDadosEdicao)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Select
                      name="id_curso"
                      value={dadosEdicao.id_curso}
                      onValueChange={(value) =>
                        handleSelectChange(value, "id_curso", setDadosEdicao)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {cursos.map((curso) => (
                          <SelectItem
                            key={curso.id_curso}
                            value={curso.id_curso}
                          >
                            {curso.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {modalState.user?.dadosProfessor && (
                <>
                  <div className="space-y-2">
                    <Label>Áreas de Interesse</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {dadosEdicao.areasDeInteresse?.length > 0
                            ? `${dadosEdicao.areasDeInteresse.length} áreas selecionadas`
                            : "Selecione as áreas"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        {areas.map((area) => (
                          <DropdownMenuCheckboxItem
                            key={area.id_area}
                            checked={dadosEdicao.areasDeInteresse?.includes(
                              area.id_area
                            )}
                            onCheckedChange={() =>
                              handleAreaChange(area.id_area)
                            }
                          >
                            {area.nome}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <Label>Disponibilidade</Label>
                    <Select
                      name="disponibilidade"
                      value={dadosEdicao.disponibilidade}
                      onValueChange={(value) =>
                        handleSelectChange(
                          value,
                          "disponibilidade",
                          setDadosEdicao
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Disponível</SelectItem>
                        <SelectItem value="0">Indisponível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limite-edit">Limite de Orientandos</Label>
                    <Input
                      id="limite-edit"
                      name="limite_orientacoes"
                      type="number"
                      value={dadosEdicao.limite_orientacoes || ""}
                      onChange={(e) => handleInputChange(e, setDadosEdicao)}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excluir Usuário */}
      <Dialog open={modalState.type === "excluir"} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar a conta de{" "}
              {modalState.user?.nome}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
