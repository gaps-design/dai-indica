const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   CONFIG
========================= */

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const caminhoProdutos = path.join(__dirname, "produtos.json");

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================
   EXTRAIR ID ML
========================= */

function extrairItemId(url) {
  const regex = /MLB\d+/;
  const resultado = url.match(regex);
  return resultado ? resultado[0] : null;
}

function lerProdutos() {
  try {
    if (!fs.existsSync(caminhoProdutos)) {
      fs.writeFileSync(caminhoProdutos, "[]");
    }

    const dados = fs.readFileSync(caminhoProdutos, "utf8");
    return JSON.parse(dados || "[]");
  } catch (erro) {
    console.log("Erro ao ler produtos.json:", erro.message);
    return [];
  }
}

function salvarProdutos(produtos) {
  fs.writeFileSync(
    caminhoProdutos,
    JSON.stringify(produtos, null, 2)
  );
}

/* =========================
   LISTAR PRODUTOS
========================= */

app.get("/api/produtos", (req, res) => {
  const produtos = lerProdutos();
  res.json(produtos);
});

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

      preco: Number(item.price).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      }),

      imagem: item.pictures?.[0]?.url || item.thumbnail,

      link: urlProduto,

      loja: "Mercado Livre",

      desconto: "Promoção"
    };

    const produtos = lerProdutos();

    const jaExiste = produtos.some(
      (p) => p.link === produto.link || p.titulo === produto.titulo
    );

    if (!jaExiste) {
      produtos.unshift(produto);
      salvarProdutos(produtos);
    }

    res.json(produto);

  } catch (erro) {
    console.log("ERRO:");
    console.log(erro.response?.data || erro.message);

    res.json({
      erro: true,
      mensagem: "Erro ao consultar produto.",
      detalhes: erro.response?.data || erro.message
    });
  }
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
