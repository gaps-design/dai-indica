const container = document.querySelector(".products");

async function carregarProdutosAutomaticos() {

  try {

    container.innerHTML = "<p>Carregando promoções...</p>";

    const resposta = await fetch("/api/produtos-publicos");

    const produtos = await resposta.json();

    container.innerHTML = "";

    produtos.forEach((produto) => {

      const card = document.createElement("div");

      card.className = "product-card";

      card.innerHTML = `
        <div class="discount">
          ${produto.desconto}
        </div>

        <div class="product-img">
          <img src="${produto.imagem}" alt="${produto.titulo}">
        </div>

        <small>${produto.loja}</small>

        <h3>${produto.titulo}</h3>

        <p class="old-price">
          ${produto.categoria}
        </p>

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

    container.innerHTML =
      "<p>Não foi possível carregar as promoções agora.</p>";

  }

}

carregarProdutosAutomaticos();
