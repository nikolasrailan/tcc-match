// Função genérica para realizar chamadas à API
async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || errorData.error || "Erro na requisição"
      );
    }

    // Retorna a resposta JSON se houver corpo, senão retorna sucesso
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    }
    return { success: true };
  } catch (error) {
    console.error(`Erro na chamada da API para ${endpoint}:`, error);
    alert(error.message);
    return null;
  }
}

// --- Funções de Usuários ---
export const getUsuarios = () => fetchApi("/usuarios");

export const updateUsuario = (id, data) =>
  fetchApi(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteUsuario = (id) =>
  fetchApi(`/usuarios/${id}`, {
    method: "DELETE",
  });

// --- Funções de Perfis (Aluno/Professor) ---
export const criarPerfil = (tipo, dados) =>
  fetchApi(tipo === "professor" ? "/professores" : "/alunos", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const updateAluno = (id, data) =>
  fetchApi(`/alunos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteAlunoProfile = (id) =>
  fetchApi(`/alunos/${id}`, {
    method: "DELETE",
  });

export const updateProfessor = (id, data) =>
  fetchApi(`/professores/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteProfessorProfile = (id) =>
  fetchApi(`/professores/${id}`, {
    method: "DELETE",
  });
