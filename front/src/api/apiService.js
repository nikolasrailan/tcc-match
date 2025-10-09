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
      let errorData = { message: response.statusText || "Erro na requisição" };
      if (contentType && contentType.includes("application/json")) {
        const body = await response.json();
        errorData.message = body.error || body.message || errorData.message;
      }
      throw new Error(errorData.message);
    }

    // Handle cases with no content in response
    if (response.status === 204) {
      return { success: true };
    }

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return { success: true };
  } catch (error) {
    console.error(`Erro na chamada da API para ${endpoint}:`, error.message);
    // Lança o erro para que a camada de UI possa capturá-lo e exibir a mensagem.
    throw error;
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
export const getProfessores = (apenasDisponiveis = false) => {
  const endpoint = apenasDisponiveis
    ? "/professores/public-list?disponivel=true"
    : "/professores/public-list";
  return fetchApi(endpoint);
};

// --- Professor Dashboard ---
export const getProfessorDashboard = () => fetchApi("/professores/dashboard");

// --- Funções de Solicitação ---
export const enviarSolicitacao = (dados) =>
  fetchApi("/solicitacoes", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const getMinhasSolicitacoes = () =>
  fetchApi("/solicitacoes/minhas-solicitacoes");

export const cancelarSolicitacao = (id) =>
  fetchApi(`/solicitacoes/${id}/cancelar`, {
    method: "PATCH",
  });

export const getSolicitacoesProfessor = () =>
  fetchApi("/solicitacoes/professor");

export const responderSolicitacao = (id, aceito) =>
  fetchApi(`/solicitacoes/${id}/responder`, {
    method: "PATCH",
    body: JSON.stringify({ aceito }),
  });

// --- Funções de Cursos ---
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

export const atualizarCurso = (id, dados) =>
  fetchApi(`/cursos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });

// --- NOVAS Funções de Áreas de Interesse ---
export const getAreasInteresse = () => fetchApi("/areas-interesse");

export const criarAreaInteresse = (dados) =>
  fetchApi("/areas-interesse", {
    method: "POST",
    body: JSON.stringify(dados),
  });

export const atualizarAreaInteresse = (id, dados) =>
  fetchApi(`/areas-interesse/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });

export const deletarAreaInteresse = (id) =>
  fetchApi(`/areas-interesse/${id}`, {
    method: "DELETE",
  });
