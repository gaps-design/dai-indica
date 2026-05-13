const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname)));

function gerarLinkAfiliado(linkOriginal) {
  // Por enquanto retorna o link normal.
  // Depois colocamos aqui seu link de afiliado do Mercado Livre.
  return linkOriginal;
}

async function buscarProdutos(termo) {
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(
      termo
    )}&limit=8`;

    const response = await axios.get(url);

    return response.data.results.map((item) => ({
      titulo: item.title,
      preco: item.price.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      }),
      imagem: item.thumbnail,
      link: gerarLinkAfiliado(item.permalink),
      loja: "Mercado Livre",
      categoria: termo,
      desconto: "Oferta"
    }));
  } catch (erro) {
    console.log(`Erro ao buscar ${termo}:`, erro.response?.data || erro.message);
    return [];
  }
}

app.get("/api/produtos", async (req, res) => {
  const termos = [
    "air fryer promoção",
    "creatina promoção",
    "garrafa térmica",
    "moda feminina promoção",
    "beleza feminina",
    "casa cozinha promoção",
    "brinquedos infantil",
    "fone bluetooth"
  ];

  let produtos = [];

  for (const termo of termos) {
    const resultado = await buscarProdutos(termo);
    produtos.push(...resultado);
  }

  res.json(produtos);
});

app.get("/api/produtos/:termo", async (req, res) => {
  const termo = req.params.termo;
  const produtos = await buscarProdutos(termo);
  res.json(produtos);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
