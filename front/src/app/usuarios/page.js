"use client";
import React from "react";
import { getUsuarios } from "@/api/usuarios";

export default function Usuarios() {
  const [usuarios, setUsuarios] = React.useState([]);

  React.useEffect(() => {
    async function fetchUsuarios() {
      const data = await getUsuarios();
      setUsuarios(data);
    }

    fetchUsuarios();
  }, []);

  return (
    <main>
      <h1>Usuarios</h1>
      <ul>
        {usuarios.map((usuario) => (
          <li key={usuario.id_usuario}>
            {usuario.id_usuario} {usuario.nome}
          </li>
        ))}
      </ul>
    </main>
  );
}
