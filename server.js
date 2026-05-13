const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

const CLIENT_ID = process.env.ML_CLIENT_ID || "2373219788729324";
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

const REDIRECT_URI = "https://www.daiindica.com.br/callback";

let accessToken = "";
let refreshToken = "";

app.use(cors());
app.use(express.static(__dirname));

app.get("/login", (req, res) => {
  const authUrl =
    `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(authUrl);
});

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

    console.log("TOKEN GERADO COM SUCESSO");
    console.log("TOKEN EXISTE?", accessToken ? "SIM" : "NÃO");

    res.send(`
      <h1>Autorizado com sucesso ✅</h1>
      <p>Agora acesse <a href="/api/produtos">/api/produtos</a></p>
    `);

  } catch (erro) {
    console.log("ERRO CALLBACK:");
    console.log(erro.response?.data || erro.message);
    res.send("Erro ao autenticar.");
  }
});

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

function formatarProduto(item, termo) {
  const preco =
    item.price ||
    item.buy_box_winner?.price ||
    item.buy_box_winner?.original_price ||
    0;

  const imagem =
    item.thumbnail ||
    item.pictures?.[0]?.url ||
    item.buy_box_winner?.thumbnail ||
    "";

  const link =
    item.permalink ||
    item.buy_box_winner?.permalink ||
    `https://www.mercadolivre.com.br/p/${item.id}`;

  return {
    titulo: item.title || item.name || "Produto Mercado Livre",
    preco: Number(preco).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    }),
    imagem,
    link,
    loja: "Mercado Livre",
    categoria: termo,
    desconto: "Oferta"
  };
}

async function buscarProdutos(termo) {
  try {
    console.log("================================");
    console.log("BUSCANDO:", termo);
    console.log("TOKEN EXISTE?", accessToken ? "SIM" : "NÃO");

    if (!accessToken) {
      console.log("SEM TOKEN");
      return [];
    }

    const url =
`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
    
    console.log("URL:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json"
      }
    });

    console.log("STATUS:", response.status);
    console.log("TOTAL RESULTADOS:", response.data.results?.length || 0);

    return (response.data.results || []).map((item) =>
      formatarProduto(item, termo)
    );

  } catch (erro) {
    console.log("ERRO PRODUTOS:");
    console.log(erro.response?.data || erro.message);

    if (erro.response?.status === 401) {
      await renovarToken();
    }

    return [];
  }
}

app.get("/api/produtos", async (req, res) => {
  const buscas = [
    "creatina",
    "garrafa termica",
    "fone bluetooth",
    "moda feminina",
    "beleza feminina"
  ];

  let produtos = [];

  for (const termo of buscas) {
    const resultado = await buscarProdutos(termo);
    produtos = produtos.concat(resultado);
  }

  res.json(produtos);
});

app.get("/api/status", (req, res) => {
  res.json({
    servidor: "online",
    token: accessToken ? "SIM" : "NÃO"
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
