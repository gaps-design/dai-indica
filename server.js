const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;

/* =========================================
   LINK DE AFILIADO
========================================= */

function gerarLinkAfiliado(linkOriginal) {

  // MERCADO LIVRE
  return `${linkOriginal}`;

}

/* =========================================
   BUSCAR PRODUTOS
========================================= */

async function buscarProdutos(termo) {

  try {

    console.log("Buscando:", termo);

    const response = await axios.get(
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    console.log("Resposta recebida");

    if (!response.data.results) {
      console.log("Sem resultados");
      return [];
    }

    return response.data.results.slice(0, 8).map((item) => ({

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

    console.log("ERRO COMPLETO:");

    console.log(erro.message);

    if (erro.response) {
      console.log(erro.response.data);
    }

    return [];
  }

}

/* =========================================
   API PRODUTOS
========================================= */

app.get("/api/produtos", async (req, res) => {

  const pesquisas = [
    "creatina promoção",
    "garrafa térmica",
    "moda feminina promoção",
    "beleza feminina",
    "casa cozinha promoção",
    "brinquedos infantil",
    "fone bluetooth"
  ];

  let produtos = [];

  for (const termo of pesquisas) {

    const resultado = await buscarProdutos(termo);

    produtos = produtos.concat(resultado);

  }

  res.json(produtos);

});

/* =========================================
   INICIAR SERVIDOR
========================================= */

app.listen(PORT, () => {

  console.log(`Servidor rodando na porta ${PORT}`);

});
