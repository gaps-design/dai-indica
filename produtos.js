const container = document.querySelector(".products");

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

async function carregarProdutosAutomaticos() {

  try {

    container.innerHTML = "<p>Carregando promoções...</p>";

    let htmlProdutos = "";

    for (const termo of buscas) {

      const url =
        `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;

      const resposta = await fetch(url);

      const dados = await resposta.json();

      if (dados.results) {

        dados.results.forEach((produto) => {

          htmlProdutos += `

            <div class="product-card">

              <div class="discount">
                Oferta
              </div>

              <div class="product-img">
                <img src="${produto.thumbnail}" alt="${produto.title}">
              </div>

              <small>
                Mercado Livre
              </small>

              <h3>
                ${produto.title}
              </h3>

              <p class="old-price">
                ${termo}
              </p>

              <p class="price">
                ${formatarPreco(produto.price)}
              </p>

              <a
                href="${produto.permalink}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-product"
              >
                Comprar agora
              </a>

            </div>

          `;

        });

      }

    }

    container.innerHTML = htmlProdutos;

  } catch (erro) {

    console.error("Erro ao carregar produtos:", erro);

    container.innerHTML = `
      <p>Não foi possível carregar as promoções agora.</p>
    `;

  }

}

carregarProdutosAutomaticos();
