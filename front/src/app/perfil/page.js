"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  updateUsuario,
  getAreasInteresse,
  sugerirAreaInteresse,
} from "@/api/apiService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function PerfilPage() {
  useAuthRedirect();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    matricula: "",
    curso: "",
    disponibilidade: "indisponivel",
    areasDeInteresse: [],
    limite_orientacoes: 5,
  });
  const [allAreas, setAllAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sugestaoModalOpen, setSugestaoModalOpen] = useState(false);
  const [novaSugestao, setNovaSugestao] = useState("");

  const fetchInitialData = useCallback(async () => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          const initialFormData = {
            nome: parsedUser.nome || "",
            email: parsedUser.email || "",
            matricula: parsedUser.dadosAluno?.matricula || "",
            curso: parsedUser.dadosAluno?.cursoInfo?.nome || "",
            disponibilidade: parsedUser.dadosProfessor?.disponibilidade
              ? "disponivel"
              : "indisponivel",
            areasDeInteresse:
              parsedUser.dadosProfessor?.areasDeInteresse?.map(
                (a) => a.id_area
              ) || [],
            limite_orientacoes:
              parsedUser.dadosProfessor?.limite_orientacoes || 5,
          };
          setFormData(initialFormData);

          if (parsedUser.dadosProfessor || parsedUser.isAdmin) {
            const areasData = await getAreasInteresse();
            if (areasData) {
              setAllAreas(areasData);
            }
          }
        } catch (e) {
          console.error("Falha ao carregar dados do perfil", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAreaDeInteresseChange = (areaId) => {
    setFormData((prev) => {
      const newAreas = prev.areasDeInteresse.includes(areaId)
        ? prev.areasDeInteresse.filter((id) => id !== areaId)
        : [...prev.areasDeInteresse, areaId];
      return { ...prev, areasDeInteresse: newAreas };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!user) {
      setError("Usuário não encontrado.");
      setLoading(false);
      return;
    }

    const dataToUpdate = {
      nome: formData.nome,
      email: formData.email,
    };

    if (user.dadosAluno) {
      dataToUpdate.matricula = formData.matricula;
    }

    if (user.dadosProfessor) {
      dataToUpdate.disponibilidade = formData.disponibilidade === "disponivel";
      dataToUpdate.areasDeInteresse = formData.areasDeInteresse;
      dataToUpdate.limite_orientacoes = formData.limite_orientacoes;
    }

    try {
      const result = await updateUsuario(user.id_usuario, dataToUpdate);
      if (result && result.user) {
        setSuccess("Perfil atualizado com sucesso!");
        localStorage.setItem("user", JSON.stringify(result.user));
        setUser(result.user);
      } else {
        throw new Error("Ocorreu um erro ao atualizar o perfil.");
      }
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSugestaoModal = () => {
    setNovaSugestao("");
    setError("");
    setSuccess("");
    setSugestaoModalOpen(true);
  };

  const handleSugestaoSubmit = async (e) => {
    e.preventDefault();
    if (!novaSugestao.trim()) {
      setError("O nome da área não pode ser vazio.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sugerirAreaInteresse({ nome: novaSugestao });
      setSuccess("Sugestão enviada para aprovação do administrador!");
      setSugestaoModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const selectedAreas = formData.areasDeInteresse
    .map((id) => allAreas.find((area) => area.id_area === id)?.nome)
    .filter(Boolean);

  return (
    <div className="container mx-auto py-8">
      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>Atualize suas informações.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campos comuns */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
              />
            </div>
            {/* Campos Aluno */}
            {user.dadosAluno && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    name="matricula"
                    value={formData.matricula || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curso">Curso</Label>
                  <Input
                    id="curso"
                    name="curso"
                    value={formData.curso || ""}
                    disabled
                  />
                </div>
              </>
            )}
            {/* Campos Professor */}
            {user.dadosProfessor && (
              <>
                <div className="space-y-2">
                  <Label>Áreas de Interesse</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-auto min-h-9"
                      >
                        <div className="flex flex-wrap gap-1">
                          {selectedAreas.length > 0 ? (
                            selectedAreas.map((areaName) => (
                              <Badge key={areaName} variant="secondary">
                                {areaName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">
                              Selecione as áreas
                            </span>
                          )}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                      <DropdownMenuLabel>
                        Selecione suas áreas
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allAreas.map((area) => (
                        <DropdownMenuCheckboxItem
                          key={area.id_area}
                          checked={formData.areasDeInteresse.includes(
                            area.id_area
                          )}
                          onCheckedChange={() =>
                            handleAreaDeInteresseChange(area.id_area)
                          }
                          onSelect={(e) => e.preventDefault()} // Evita que o menu feche ao clicar
                        >
                          {area.nome}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span
                    onClick={handleOpenSugestaoModal}
                    className="text-xs text-muted-foreground underline cursor-pointer hover:text-primary mt-2 inline-block"
                  >
                    Não encontrou uma área? Sugira uma nova.
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Disponibilidade</Label>
                  <Select
                    name="disponibilidade"
                    value={formData.disponibilidade}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        disponibilidade: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disponibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="indisponivel">Indisponível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limite_orientacoes">
                    Limite de Orientandos
                  </Label>
                  <Input
                    id="limite_orientacoes"
                    name="limite_orientacoes"
                    type="number"
                    value={formData.limite_orientacoes || ""}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex-grow">
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={sugestaoModalOpen} onOpenChange={setSugestaoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sugerir Nova Área de Interesse</DialogTitle>
            <DialogDescription>
              A sua sugestão será enviada para aprovação do administrador.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSugestaoSubmit} className="space-y-4 pt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="sugestao-area">Nome da Área</Label>
              <Input
                id="sugestao-area"
                value={novaSugestao}
                onChange={(e) => setNovaSugestao(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Enviando..." : "Enviar Sugestão"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
