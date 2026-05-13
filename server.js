const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 10000;

/* =========================
   CONFIG ML
========================= */

const CLIENT_ID = "2373219788729324";

const CLIENT_SECRET =
  process.env.ML_CLIENT_SECRET;

const REDIRECT_URI =
  "https://www.daiindica.com.br/callback";

/* =========================
   VARIÁVEIS
========================= */

let accessToken = "";
let refreshToken = "";

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());

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
   LOGIN ML
========================= */

app.get("/login", (req, res) => {

  const authUrl =
    `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(authUrl);

});

/* =========================
   CALLBACK
========================= */

app.get("/callback", async (req, res) => {

  const code = req.query.code;

  try {

    const response = await axios.post(
      "https://api.mercadolibre.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        }
      }
    );

    accessToken = response.data.access_token;

    refreshToken = response.data.refresh_token;

    res.send(`
      <h1>Autorizado com sucesso ✅</h1>
      <p>Agora volte para <a href="/admin.html">admin.html</a></p>
    `);

  } catch (erro) {

    console.log(
      erro.response?.data || erro.message
    );

    res.send("Erro ao autenticar.");

  }

});

/* =========================
   EXTRAIR ITEM ID
========================= */

function extrairItemId(url) {

  const regex = /MLB[-]?\d+/i;

  const resultado = url.match(regex);

  if (!resultado) return null;

  return resultado[0].replace("-", "");

}

/* =========================
   GERAR PRODUTO
========================= */

app.get("/api/gerar-produto", async (req, res) => {

  try {

    if (!accessToken) {

      return res.json({
        erro: true,
        mensagem:
          "Faça login primeiro em /login"
      });

    }

    const urlProduto = req.query.url;

    const itemId =
      extrairItemId(urlProduto);

    if (!itemId) {

      return res.json({
        erro: true,
        mensagem:
          "ID do produto não encontrado."
      });

    }

    console.log("ITEM:", itemId);

    const response = await axios.get(
      `https://api.mercadolibre.com/items/${itemId}`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

    const item = response.data;

    const produto = {

      titulo: item.title,

      preco: Number(item.price)
        .toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL"
          }
        ),

      imagem:
        item.pictures?.[0]?.secure_url ||
        item.thumbnail,

      link: urlProduto,

      loja: "Mercado Livre",

      desconto: "Oferta"

    };

    let produtos = [];

    if (
      fs.existsSync("produtos.json")
    ) {

      produtos = JSON.parse(
        fs.readFileSync(
          "produtos.json",
          "utf8"
        )
      );

    }

    produtos.unshift(produto);

    fs.writeFileSync(
      "produtos.json",
      JSON.stringify(
        produtos,
        null,
        2
      )
    );

    res.json(produto);

  } catch (erro) {

    console.log(
      erro.response?.data || erro.message
    );

    res.json({
      erro: true,
      mensagem:
        "Erro ao consultar produto.",
      detalhes:
        erro.response?.data || erro.message
    });

  }

});

/* =========================
   LISTAR PRODUTOS
========================= */

app.get("/api/produtos", (req, res) => {

  try {

    if (
      !fs.existsSync("produtos.json")
    ) {

      return res.json([]);

    }

    const produtos = JSON.parse(
      fs.readFileSync(
        "produtos.json",
        "utf8"
      )
    );

    res.json(produtos);

  } catch (erro) {

    res.json([]);

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
