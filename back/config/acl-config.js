const aclConfig = {
  baseUrl: "/", // Base para recursos
  defaultRole: "aluno", // Papel padrão
  decodedObjectName: "user", // Nome do objeto decodificado
  roleSearchPath: "user.role", // Caminho para buscar o papel no JWT
  filename: "acl.json", // Nome do arquivo ACL
  path: "config", // Caminho para a pasta de configuração
};

module.exports = aclConfig;
