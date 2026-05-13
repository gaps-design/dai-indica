const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   CONFIG MERCADO LIVRE
========================= */

const CLIENT_ID =
  process.env.ML_CLIENT_ID || "2373219788729324";

const CLIENT_SECRET =
  process.env.ML_CLIENT_SECRET;

const REDIRECT_URI =
  "https://www.daiindica.com.br/callback";

/* =========================
   VARIÁVEIS
========================= */

let accessToken = "";
let refreshToken = "";
let userId = "";

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.static(__dirname));

/* =========================
   LOGIN
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
    userId = response.data.user_id;

    console.log("================================");
    console.log("TOKEN GERADO COM SUCESSO");
    console.log("USER ID:", userId);
    console.log("TOKEN EXISTE?", accessToken ? "SIM" : "NÃO");
    console.log("================================");

    res.send(`
      <h1>Autorizado com sucesso ✅</h1>

      <p>User ID: ${userId}</p>

      <p>Teste agora:
      <a href="/api/status">/api/status</a></p>

      <p>Teste produtos:
      <a href="/api/produtos-publicos">/api/produtos-publicos</a></p>
    `);

  } catch (erro) {

    console.log("ERRO CALLBACK:");
    console.log(erro.response?.data || erro.message);

    res.send("Erro ao autenticar.");

  }

});

/* =========================
   RENOVAR TOKEN
========================= */

async function renovarToken() {

  if (!refreshToken) return;

  try {

    const response = await axios.post(
      "https://api.mercadolibre.com/oauth/token",
      {
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken
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

    console.log("TOKEN RENOVADO COM SUCESSO");

  } catch (erro) {

    console.log("ERRO AO RENOVAR TOKEN:");
    console.log(erro.response?.data || erro.message);

  }

}

/* =========================
   STATUS
========================= */

app.get("/api/status", (req, res) => {

  res.json({
    servidor: "online",
    token: accessToken ? "SIM" : "NÃO",
    userId
  });

});

/* =========================
   PRODUTOS PÚBLICOS
========================= */

app.get("/api/produtos-publicos", async (req, res) => {

  try {

    const buscas = [
      "iphone",
      "creatina",
      "garrafa termica",
      "fone bluetooth",
      "moda feminina"
    ];

    let produtos = [];

    for (const termo of buscas) {

      const url =
        `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;

      console.log("BUSCANDO:", termo);

      const response = await axios.get(url);

      const resultado = response.data.results.map((item) => ({

        titulo: item.title,

        preco: Number(item.price).toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL"
          }
        ),

        imagem: item.thumbnail,
        link: item.permalink,
        categoria: termo,
        loja: "Mercado Livre",
        desconto: "Oferta"

      }));

      produtos = produtos.concat(resultado);

    }

    res.json(produtos);

  } catch (erro) {

    console.log("ERRO PRODUTOS:");
    console.log(erro.response?.data || erro.message);

    res.json({
      erro: true,
      detalhes: erro.response?.data || erro.message
    });

  }

});

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

  res.sendFile(path.join(__dirname, "index.html"));

});

/* =========================
   START
========================= */

app.listen(PORT, () => {

  console.log(`Servidor rodando na porta ${PORT}`);

});
