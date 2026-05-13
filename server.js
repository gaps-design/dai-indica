const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

/* =========================
   CONFIG MERCADO LIVRE
========================= */

const CLIENT_ID = "SEU_CLIENT_ID";
const CLIENT_SECRET = "SEU_CLIENT_SECRET";

const REDIRECT_URI =
  "https://www.daiindica.com.br/callback";

let accessToken = "";
let refreshToken = "";

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.static(__dirname));

/* =========================
   LOGIN MERCADO LIVRE
========================= */

app.get("/login", (req, res) => {
  const authUrl =
    `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

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

    console.log("ACCESS TOKEN:");
    console.log(accessToken);

    console.log("REFRESH TOKEN:");
    console.log(refreshToken);

    res.send(`
      <h1>Autorizado com sucesso ✅</h1>
      <p>Volte para o site.</p>
    `);

  } catch (erro) {
    console.log("ERRO CALLBACK:");
    console.log(
      erro.response?.data || erro.message
    );

    res.send("Erro ao autenticar.");
  }
});

/* =========================
   RENOVAR TOKEN
========================= */

async function renovarToken() {
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

    console.log("TOKEN RENOVADO");

  } catch (erro) {

    console.log("ERRO RENOVAR TOKEN:");
    console.log(
      erro.response?.data || erro.message
    );
  }
}

/* =========================
   BUSCAR PRODUTOS
========================= */

async function buscarProdutos(termo) {

  try {

    console.log("Buscando:", termo);

    if (!accessToken) {
      console.log("SEM TOKEN");
      return [];
    }

    const url =
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=8`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data.results.map((item) => ({

      titulo: item.title,

      preco: item.price.toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      ),

      imagem: item.thumbnail,

      link: item.permalink,

      loja: "Mercado Livre",

      categoria: termo,

      desconto: "Oferta"

    }));

  } catch (erro) {

    console.log("ERRO PRODUTOS:");

    console.log(
      erro.response?.data || erro.message
    );

    if (
      erro.response?.status === 401
    ) {
      await renovarToken();
    }

    return [];
  }
}

/* =========================
   API PRODUTOS
========================= */

app.get("/api/produtos", async (req, res) => {

  const buscas = [
    "creatina",
    "garrafa termica",
    "fone bluetooth",
    "moda feminina promoção",
    "beleza feminina"
  ];

  let produtos = [];

  for (const termo of buscas) {

    const resultado =
      await buscarProdutos(termo);

    produtos = [
      ...produtos,
      ...resultado
    ];
  }

  res.json(produtos);
});

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(
    `Servidor rodando na porta ${PORT}`
  );
});
