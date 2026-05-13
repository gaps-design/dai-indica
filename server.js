const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname)));

const CLIENT_ID = "2373219788729324";
const CLIENT_SECRET = "COLE_SUA_CHAVE_SECRETA_AQUI";
const REDIRECT_URI = "https://outlying-zesty-frivolous.ngrok-free.dev/callback";

let ACCESS_TOKEN = "";

// LOGIN
app.get("/login", (req, res) => {
  const authUrl =
    `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(authUrl);
});

// CALLBACK
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      "https://api.mercadolibre.com/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    ACCESS_TOKEN = response.data.access_token;

    console.log("TOKEN GERADO COM SUCESSO");
    console.log(response.data);

    res.send("Autorizado com sucesso! Agora acesse /api/produtos");

  } catch (error) {
    console.log("Erro ao autenticar:", error.response?.data || error.message);
    res.send("Erro ao autenticar");
  }
});

// BUSCAR PRODUTOS
async function buscarProdutos(termo) {
  try {
    const response = await axios.get(
      "https://api.mercadolibre.com/sites/MLB/search",
      {
        params: {
          q: termo,
          limit: 8
        },
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      }
    );

    const resultados = response.data.results || [];

    return resultados.map((item) => ({
      titulo: item.title || "Produto Mercado Livre",
      preco: item.price
        ? item.price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          })
        : "Ver preço",
      imagem: item.thumbnail || "img/logo/logo1.jpg",
      link: item.permalink || "#",
      loja: "Mercado Livre",
      categoria: termo,
      desconto: "Oferta"
    }));

  } catch (erro) {
    console.log(`Erro ao buscar ${termo}:`, erro.response?.data || erro.message);
    return [];
  }
}

// API PRODUTOS
app.get("/api/produtos", async (req, res) => {
  const termos = [
    "creatina",
    "garrafa termica",
    "moda feminina",
    "beleza feminina",
    "casa cozinha",
    "infantil"
  ];

  let produtos = [];

  for (const termo of termos) {
    const resultado = await buscarProdutos(termo);
    produtos.push(...resultado);
  }

  res.json(produtos);
});

// TESTE SIMPLES
app.get("/teste-mercado-livre", async (req, res) => {
  const resultado = await buscarProdutos("iphone");
  res.json(resultado);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Autorizar em: http://localhost:${PORT}/login`);
  console.log(`Teste em: http://localhost:${PORT}/teste-mercado-livre`);
});