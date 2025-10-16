const { Reuniao, Orientacao, Aluno, Professor, Usuario } = require("../models");

const reuniaoController = {
  async listarReunioes(req, res) {
    try {
      const { id_orientacao } = req.params;
      const reunioes = await Reuniao.findAll({
        where: { id_orientacao },
        order: [["data_horario", "DESC"]],
      });
      res.status(200).json(reunioes);
    } catch (error) {
      console.error("Erro ao listar reuniões:", error);
      res.status(500).json({ error: "Erro ao listar reuniões." });
    }
  },

  async criarReuniao(req, res) {
    try {
      const { id_orientacao } = req.params;
      const { data_horario, pauta } = req.body;
      const novaReuniao = await Reuniao.create({
        id_orientacao,
        data_horario,
        pauta,
        status: "marcada",
      });
      res.status(201).json(novaReuniao);
    } catch (error) {
      console.error("Erro ao criar reunião:", error);
      res.status(500).json({ error: "Erro ao criar reunião." });
    }
  },

  async atualizarReuniao(req, res) {
    try {
      const { id_reuniao } = req.params;
      const { data_horario, pauta, status } = req.body;

      const reuniao = await Reuniao.findByPk(id_reuniao);
      if (!reuniao) {
        return res.status(404).json({ message: "Reunião não encontrada." });
      }

      // Lógica de permissão (simplificada)
      // O ideal seria verificar se o req.user.id pertence ao aluno ou professor da orientação

      const dataToUpdate = {};
      if (data_horario) dataToUpdate.data_horario = data_horario;
      if (pauta) dataToUpdate.pauta = pauta;
      if (status) dataToUpdate.status = status;

      await reuniao.update(dataToUpdate);

      res.status(200).json(reuniao);
    } catch (error) {
      console.error("Erro ao atualizar reunião:", error);
      res.status(500).json({ error: "Erro ao atualizar reunião." });
    }
  },
};

module.exports = reuniaoController;
