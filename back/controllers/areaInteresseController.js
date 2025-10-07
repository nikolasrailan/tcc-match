const { AreaInteresse } = require("../models");

const areaInteresseController = {
  async listar(req, res) {
    try {
      const areas = await AreaInteresse.findAll({ order: [["nome", "ASC"]] });
      res.status(200).json(areas);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar áreas de interesse." });
    }
  },

  async criar(req, res) {
    try {
      const { nome } = req.body;
      const novaArea = await AreaInteresse.create({ nome });
      res.status(201).json(novaArea);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar área de interesse." });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome } = req.body;
      const [updated] = await AreaInteresse.update(
        { nome },
        { where: { id_area: id } }
      );
      if (updated) {
        const areaAtualizada = await AreaInteresse.findByPk(id);
        res.status(200).json(areaAtualizada);
      } else {
        res.status(404).json({ message: "Área de interesse não encontrada." });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar área de interesse." });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      const deleted = await AreaInteresse.destroy({ where: { id_area: id } });
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Área de interesse não encontrada." });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar área de interesse." });
    }
  },
};

module.exports = areaInteresseController;
