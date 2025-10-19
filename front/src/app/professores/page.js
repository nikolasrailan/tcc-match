// front/src/app/professores/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getProfessores } from "@/api/apiService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfessoresPage() {
  useAuthRedirect();
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessores = async () => {
      setLoading(true);
      const data = await getProfessores();
      if (data) {
        setProfessores(data);
      }
      setLoading(false);
    };

    fetchProfessores();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Professores Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Áreas de Interesse</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vagas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professores
                  .filter((prof) => prof.usuario)
                  .map((prof) => (
                    <TableRow key={prof.id_professor}>
                      <TableCell className="font-medium">
                        {prof.usuario.nome}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {prof.areasDeInteresse &&
                          prof.areasDeInteresse.length > 0 ? (
                            prof.areasDeInteresse.map((area) => (
                              <Badge key={area.id_area} variant="secondary">
                                {area.nome}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">
                              Nenhuma
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{prof.usuario.email}</TableCell>
                      <TableCell>
                        {prof.orientandos_atuais !== undefined &&
                        prof.limite_orientacoes
                          ? `${prof.orientandos_atuais} / ${prof.limite_orientacoes}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {prof.disponibilidade &&
                        prof.orientandos_atuais < prof.limite_orientacoes ? (
                          <Badge>Disponível</Badge>
                        ) : (
                          <Badge variant="destructive">Indisponível</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
