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
let userId = "";

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
    userId = response.data.user_id;

    console.log("TOKEN GERADO COM SUCESSO");
    console.log("USER ID:", userId);

    res.send(`
      <h1>Autorizado com sucesso ✅</h1>
      <p>User ID: ${userId}</p>
      <p>Teste agora: <a href="/api/status">/api/status</a></p>
      <p>Depois teste: <a href="/api/meus-anuncios">/api/meus-anuncios</a></p>
    `);
  } catch (erro) {
    console.log("ERRO CALLBACK:");
    console.log(erro.response?.data || erro.message);
    res.send("Erro ao autenticar.");
  }
});

app.get("/api/status", async (req, res) => {
  res.json({
    servidor: "online",
    token: accessToken ? "SIM" : "NÃO",
    userId: userId || "SEM USER ID"
  });
});

app.get("/api/me", async (req, res) => {
  try {
    if (!accessToken) {
      return res.json({ erro: "Sem token. Acesse /login primeiro." });
    }

    const response = await axios.get("https://api.mercadolibre.com/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json"
      }
    });

    res.json(response.data);
  } catch (erro) {
    res.json(erro.response?.data || { erro: erro.message });
  }
});

app.get("/api/produtos-publicos", async (req, res) => {

  try {

    const url =
      "https://api.mercadolibre.com/sites/MLB/search?q=iphone&limit=5";

    const response = await axios.get(url);

    res.json(response.data.results);

  } catch (erro) {

    res.json({
      erro: true,
      detalhes: erro.response?.data || erro.message
    });

  }

});

    const ids = searchResponse.data.results || [];

    if (ids.length === 0) {
      return res.json({
        aviso: "Sua conta autorizada não possui anúncios próprios no Mercado Livre.",
        userId,
        total: 0,
        produtos: []
      });
    }

    const itemsUrl =
      `https://api.mercadolibre.com/items?ids=${ids.slice(0, 20).join(",")}`;

    const itemsResponse = await axios.get(itemsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json"
      }
    });

    const produtos = itemsResponse.data.map((registro) => {
      const item = registro.body;

      return {
        titulo: item.title,
        preco: Number(item.price || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        }),
        imagem: item.thumbnail,
        link: item.permalink,
        loja: "Mercado Livre",
        categoria: item.category_id,
        desconto: "Oferta"
      };
    });

    res.json(produtos);
  } catch (erro) {
    console.log("ERRO MEUS ANÚNCIOS:");
    console.log(erro.response?.data || erro.message);
    res.json(erro.response?.data || { erro: erro.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
