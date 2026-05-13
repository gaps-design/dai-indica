const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static(__dirname));

async function testarBusca(termo) {
  const urls = [
    `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}`,
    `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=8`,
    `https://api.mercadolibre.com/sites/MLB/search?category=MLB1055&q=${encodeURIComponent(termo)}`
  ];

  for (const url of urls) {
    try {
      console.log("Testando URL:", url);

      const response = await axios.get(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          "Origin": "https://www.mercadolivre.com.br",
          "Referer": "https://www.mercadolivre.com.br/"
        }
      });

      console.log("FUNCIONOU:", url);

      return response.data.results.slice(0, 8).map((item) => ({
        titulo: item.title,
        preco: item.price.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        }),
        imagem: item.thumbnail,
        link: item.permalink,
        loja: "Mercado Livre",
        categoria: termo,
        desconto: "Oferta"
      }));
    } catch (erro) {
      console.log("FALHOU:", url);
      console.log(erro.response?.data || erro.message);
    }
  }

  return [];
}

app.get("/api/produtos", async (req, res) => {
  const termos = ["creatina", "garrafa térmica", "fone bluetooth"];
  let produtos = [];

  for (const termo of termos) {
    const resultado = await testarBusca(termo);
    produtos = produtos.concat(resultado);
  }

  res.json(produtos);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
