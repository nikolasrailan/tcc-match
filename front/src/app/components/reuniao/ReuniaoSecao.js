"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const renderReuniaoStatusBadge = (status) => {
  switch (status) {
    case "marcada":
      return <Badge variant="secondary">Marcada</Badge>;
    case "realizada":
      return <Badge className="bg-green-500">Realizada</Badge>;
    case "cancelada":
      return <Badge variant="destructive">Cancelada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ReunioesSection = ({
  reunioes,
  onOpenCreateModal,
  onOpenEditModal,
  onStatusChange,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Reuniões</Label>
        <Button variant="outline" size="sm" onClick={onOpenCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Agendar Reunião
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data e Hora</TableHead>
              <TableHead>Pauta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reunioes.length > 0 ? (
              reunioes.map((reuniao) => (
                <TableRow key={reuniao.id_reuniao}>
                  <TableCell>
                    {new Date(reuniao.data_horario).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>{reuniao.pauta}</TableCell>
                  <TableCell>
                    {renderReuniaoStatusBadge(reuniao.status)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {reuniao.status === "marcada" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onOpenEditModal(reuniao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            onStatusChange(reuniao.id_reuniao, "realizada")
                          }
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            onStatusChange(reuniao.id_reuniao, "cancelada")
                          }
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  Nenhuma reunião agendada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ReunioesSection;
