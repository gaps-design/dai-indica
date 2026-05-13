const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

const CLIENT_ID = process.env.ML_CLIENT_ID || "2373219788729324";
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const REDIRECT_URI = "https://www.daiindica.com.br/callback";

let accessToken = process.env.ACCESS_TOKEN || "";
let refreshToken = "";
let userId = "";

const caminhoProdutos = path.join(__dirname, "produtos.json");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function lerProdutos() {
  try {
    if (!fs.existsSync(caminhoProdutos)) {
      fs.writeFileSync(caminhoProdutos, "[]");
    }

    const dados = fs.readFileSync(caminhoProdutos, "utf8");
    return JSON.parse(dados || "[]");
  } catch {
    return [];
  }
}

function salvarProdutos(produtos) {
  fs.writeFileSync(caminhoProdutos, JSON.stringify(produtos, null, 2));
}

function extrairItemId(url) {
  const itemIdNaUrl = url.match(/item_id%3A(MLB\d+)/i);
  if (itemIdNaUrl) return itemIdNaUrl[1];

  const wid = url.match(/wid=(MLB\d+)/i);
  if (wid) return wid[1];

  const regex = /MLB[-]?\d+/gi;
  const ids = url.match(regex);

  if (!ids || !ids.length) return null;

  return ids[ids.length - 1].replace("-", "");
}

/* HOME */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* LOGIN MERCADO LIVRE */
app.get("/login", (req, res) => {
  const authUrl =
    `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(authUrl);
});

/* CALLBACK */
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
    userId = response.data.user_id;

    console.log("TOKEN GERADO COM SUCESSO");
    console.log("USER ID:", userId);

    res.send(`
      <h1>Autorizado com sucesso ✅</h1>
      <p>User ID: ${userId}</p>
      <p>Agora volte para <a href="/admin.html">/admin.html</a></p>
    `);

  } catch (erro) {
    console.log("ERRO CALLBACK:");
    console.log(erro.response?.data || erro.message);

    res.send("Erro ao autenticar.");
  }
});

/* STATUS */
app.get("/api/status", (req, res) => {
  res.json({
    servidor: "online",
    token: accessToken ? "SIM" : "NÃO",
    userId: userId || "não autenticado"
  });
});

/* LISTAR PRODUTOS */
app.get("/api/produtos", (req, res) => {
  res.json(lerProdutos());
});

/* GERAR PRODUTO */
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

    if (!accessToken) {
      return res.json({
        erro: true,
        mensagem: "Sem token. Acesse /login primeiro para autorizar o Mercado Livre."
      });
    }

    console.log("ITEM ID:", itemId);

    const response = await axios.get(
      `https://api.mercadolibre.com/items/${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json"
        }
      }
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
      desconto: "Oferta"
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
    console.log("ERRO AO GERAR PRODUTO:");
    console.log(erro.response?.data || erro.message);

    res.json({
      erro: true,
      mensagem: "Erro ao consultar produto.",
      detalhes: erro.response?.data || erro.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
