const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 10000;
const caminhoProdutos = path.join(__dirname, "produtos.json");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function lerProdutos() {
  if (!fs.existsSync(caminhoProdutos)) fs.writeFileSync(caminhoProdutos, "[]");
  return JSON.parse(fs.readFileSync(caminhoProdutos, "utf8") || "[]");
}

function salvarProdutos(produtos) {
  fs.writeFileSync(caminhoProdutos, JSON.stringify(produtos, null, 2));
}

function nomeLoja(slug) {
  const lojas = {
    "mercado-livre": "Mercado Livre",
    "shopee": "Shopee",
    "magalu": "Magalu",
    "amazon": "Amazon",
    "natura": "Natura",
    "boticario": "O Boticário"
  };
  return lojas[slug] || slug;
}

function nomeCategoria(slug) {
  const categorias = {
    "tecnologia": "Tecnologia",
    "casa": "Casa",
    "beleza": "Beleza",
    "moda": "Moda",
    "infantil": "Infantil",
    "mercado": "Mercado"
  };
  return categorias[slug] || slug;
}

async function extrairDadosDoLink(url) {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const $ = cheerio.load(response.data);

  const titulo =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text() ||
    "Produto";

  const imagem =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    "";

  let preco =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('[itemprop="price"]').attr("content") ||
    "";

  if (preco) {
    preco = Number(preco).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  } else {
    preco = "Ver preço";
  }

  return { titulo, imagem, preco };
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/produtos", (req, res) => {
  res.json(lerProdutos());
});

app.post("/api/publicar-produto", async (req, res) => {
  try {
    const { link, lojaSlug, categoriaSlug, destaque } = req.body;

    if (!link) {
      return res.json({ erro: true, mensagem: "Link não enviado." });
    }

    const dados = await extrairDadosDoLink(link);

    const produto = {
      titulo: dados.titulo,
      preco: dados.preco,
      imagem: dados.imagem,
      link,
      loja: nomeLoja(lojaSlug),
      lojaSlug,
      categoria: nomeCategoria(categoriaSlug),
      categoriaSlug,
      desconto: "Oferta",
      destaque: destaque === true
    };

    const produtos = lerProdutos();
    produtos.unshift(produto);
    salvarProdutos(produtos);

    res.json({ sucesso: true, produto });

  } catch (erro) {
    console.log("ERRO AO PUBLICAR:", erro.message);
    res.json({
      erro: true,
      mensagem: "Não foi possível ler esse link automaticamente."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
