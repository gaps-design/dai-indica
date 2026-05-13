const areaProdutos = document.querySelector(".products");

const buscas = [
  "creatina",
  "garrafa termica",
  "fone bluetooth",
  "moda feminina",
  "beleza feminina"
];

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function criarCardProduto(produto, termo) {
  return `
    <div class="product-card">
      <span class="discount">Oferta</span>

      <div class="product-img">
        <img src="${produto.thumbnail}" alt="${produto.title}">
      </div>

      <small>Mercado Livre • ${termo}</small>

      <h3>${produto.title}</h3>

      <p class="price">${formatarPreco(produto.price)}</p>

      <a href="${produto.permalink}" target="_blank" class="btn-product">
        Ver oferta
      </a>
    </div>
  `;
}

async function buscarProdutosMercadoLivre() {
  try {
    areaProdutos.innerHTML = "<p>Carregando promoções...</p>";

    let produtos = [];

    for (const termo of buscas) {
      const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;

      const resposta = await fetch(url);
      const dados = await resposta.json();

      if (dados.results) {
        const cards = dados.results.map((produto) =>
          criarCardProduto(produto, termo)
        );

        produtos = produtos.concat(cards);
      }
    }

    areaProdutos.innerHTML = produtos.join("");

  } catch (erro) {
    console.error("Erro ao buscar produtos:", erro);

    areaProdutos.innerHTML = `
      <p>Não foi possível carregar as promoções agora.</p>
    `;
  }
}

buscarProdutosMercadoLivre();
