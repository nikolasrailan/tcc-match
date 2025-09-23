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

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      let errorData = {};
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      }
      throw new Error(
        errorData.message || response.statusText || "Erro na requisição"
      );
    }

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return { success: true };
  } catch (error) {
    console.error(`Erro na chamada da API para ${endpoint}:`, error);
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

export const deleteAlunoProfile = (id) =>
  fetchApi(`/alunos/${id}`, {
    method: "DELETE",
  });

export const deleteProfessorProfile = (id) =>
  fetchApi(`/professores/${id}`, {
    method: "DELETE",
  });

// --- Funções de Ideia de TCC ---
export const getMinhaIdeiaTcc = () => fetchApi("/ideias-tcc/minha-ideia");

export const getTodasIdeiasTcc = () => fetchApi("/ideias-tcc");

export const criarIdeiaTcc = (dados) =>
  fetchApi("/ideias-tcc", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const atualizarIdeiaTcc = (id, dados) =>
  fetchApi(`/ideias-tcc/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });

export const deletarIdeiaTcc = (id) =>
  fetchApi(`/ideias-tcc/${id}`, {
    method: "DELETE",
  });

// --- Funções de Professores Públicos ---
export const getProfessores = () => fetchApi("/professores/public-list");

export const enviarSolicitacao = (dados) =>
  fetchApi("/solicitacoes", {
    method: "POST",
    body: JSON.stringify(dados),
  });

// --- NOVAS Funções de Cursos ---
export const getCursos = () => fetchApi("/cursos");

export const criarCurso = (dados) =>
  fetchApi("/cursos", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const deletarCurso = (id) =>
  fetchApi(`/cursos/${id}`, {
    method: "DELETE",
  });
