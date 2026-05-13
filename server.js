const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

/* =========================
   CONFIG
========================= */

app.use(cors());
app.use(express.static(__dirname));

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "index.html")
  );

});

/* =========================
   EXTRAIR ID ML
========================= */

function extrairItemId(url) {

  const regex = /MLB\d+/;

  const resultado = url.match(regex);

  return resultado ? resultado[0] : null;

}

/* =========================
   GERAR PRODUTO
========================= */

app.get("/api/gerar-produto", async (req, res) => {

  try {

    const urlProduto = req.query.url;

    if (!urlProduto) {

      return res.json({
        erro: true,
        mensagem: "Link não enviado."
      });

    }

    const itemId = extrairItemId(urlProduto);

    if (!itemId) {

      return res.json({
        erro: true,
        mensagem: "Não foi possível encontrar o ID do produto."
      });

    }

    console.log("ITEM ID:", itemId);

    const response = await axios.get(
      `https://api.mercadolibre.com/items/${itemId}`
    );

    const item = response.data;

    const produto = {

      titulo: item.title,

      preco: Number(item.price).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      ),

      imagem:
        item.pictures?.[0]?.url ||
        item.thumbnail,

      link: urlProduto,

      loja: "Mercado Livre",

      desconto: "Promoção"

    };

    res.json(produto);

  } catch (erro) {

    console.log("ERRO:");
    console.log(
      erro.response?.data || erro.message
    );

    res.json({
      erro: true,
      mensagem: "Erro ao consultar produto.",
      detalhes:
        erro.response?.data || erro.message
    });

  }

});

/* =========================
   START
========================= */

app.listen(PORT, () => {

  console.log(
    `Servidor rodando na porta ${PORT}`
  );

});
