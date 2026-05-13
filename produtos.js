const container = document.querySelector(".products");

async function carregarProdutosAutomaticos() {

  try {

    container.innerHTML = `
      <p>Carregando promoções...</p>
    `;

    const resposta = await fetch("/produtos.json");

    const produtos = await resposta.json();

    container.innerHTML = "";

    if (!produtos.length) {

      container.innerHTML = `
        <p>Nenhuma promoção cadastrada ainda.</p>
      `;

      return;

    }

    produtos.forEach((produto) => {

      const card = document.createElement("div");

      card.className = "product-card";

      card.innerHTML = `
        <div class="discount">
          ${produto.desconto || "Oferta"}
        </div>

        <div class="product-img">
          <img
            src="${produto.imagem}"
            alt="${produto.titulo}"
          >
        </div>

        <small>
          ${produto.loja || "Mercado Livre"}
        </small>

        <h3>
          ${produto.titulo}
        </h3>

        <p class="price">
          ${produto.preco}
        </p>

        <a
          href="${produto.link}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-product"
        >
          Comprar agora
        </a>
      `;

      container.appendChild(card);

    });

  } catch (erro) {

    console.error(
      "Erro ao carregar produtos:",
      erro
    );

    container.innerHTML = `
      <p>Erro ao carregar promoções.</p>
    `;

  }

}

carregarProdutosAutomaticos();
