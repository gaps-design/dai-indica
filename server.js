const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const cheerio = require("cheerio");

const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;

// ===============================
// FIREBASE
// ===============================

const serviceAccount = {
  type: "service_account",
  project_id: "dai-indica",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ===============================
// FUNÇÕES AUXILIARES
// ===============================

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
    $('meta[name="twitter:data1"]').attr("content") ||
    "";

  let desconto =
    $(".andes-money-amount__discount").first().text().trim() ||
    $('[class*="discount"]').first().text().trim() ||
    "";

  const precoTextoPagina =
    $(".andes-money-amount__fraction").first().text().trim();

  if (!preco && precoTextoPagina) {
    preco = precoTextoPagina;
  }

  if (preco && !String(preco).includes("R$")) {
    preco = Number(String(preco).replace(/\D/g, "")).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  if (!preco || preco === "R$ NaN") {
    preco = "Ver preço";
  }

  if (!desconto) {
    desconto = "Oferta";
  }

  return { titulo, imagem, preco, desconto };
}

// ===============================
// ROTAS
// ===============================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// LISTAR PRODUTOS
app.get("/api/produtos", async (req, res) => {
  try {
    const snapshot = await db.collection("produtos").get();

    const produtos = [];

    snapshot.forEach((doc) => {
      produtos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(produtos);

  } catch (erro) {
    console.log("ERRO AO BUSCAR PRODUTOS:", erro);

    res.status(500).json({
      erro: true,
      mensagem: "Erro ao carregar produtos"
    });
  }
});

// PUBLICAR PRODUTO
app.post("/api/publicar-produto", async (req, res) => {
  try {
    const { link, lojaSlug, categoriaSlug, destaque } = req.body;

    if (!link) {
      return res.json({
        erro: true,
        mensagem: "Link não enviado."
      });
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
      destaque: destaque === true,
      criadoEm: new Date()
    };

    const docRef = await db.collection("produtos").add(produto);

    res.json({
      sucesso: true,
      id: docRef.id,
      produto
    });

  } catch (erro) {
    console.log("ERRO AO PUBLICAR:", erro.message);

    res.json({
      erro: true,
      mensagem: "Não foi possível ler esse link automaticamente."
    });
  }
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
