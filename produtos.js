const container = document.querySelector(".products");

function obterParametro(nome) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nome);
}

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

async function carregarProdutosAutomaticos() {
  try {
    container.innerHTML = "<p>Carregando promoções...</p>";

    const resposta = await fetch("/produtos.json");
    const produtos = await resposta.json();

    const lojaFiltro = obterParametro("loja");
    const categoriaFiltro = obterParametro("categoria");

    let produtosFiltrados = produtos;

    if (lojaFiltro) {
      produtosFiltrados = produtos.filter((produto) =>
        (produto.lojaSlug || normalizar(produto.loja)) === lojaFiltro
      );
    } else if (categoriaFiltro) {
      produtosFiltrados = produtos.filter((produto) =>
        (produto.categoriaSlug || normalizar(produto.categoria)) === categoriaFiltro
      );
    } else {
      produtosFiltrados = produtos.filter((produto) => produto.destaque === true);
    }

    container.innerHTML = "";

    if (!produtosFiltrados.length) {
      container.innerHTML = "<p>Nenhuma promoção cadastrada ainda.</p>";
      return;
    }

    produtosFiltrados.forEach((produto) => {
      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
        <div class="discount">${produto.desconto || "Oferta"}</div>

        <div class="product-img">
          <img src="${produto.imagem}" alt="${produto.titulo}">
        </div>

        <small>${produto.loja || "Loja"} • ${produto.categoria || "Categoria"}</small>

        <h3>${produto.titulo}</h3>

        <p class="price">${produto.preco}</p>

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
    console.error("Erro ao carregar produtos:", erro);
    container.innerHTML = "<p>Erro ao carregar promoções.</p>";
  }
}

carregarProdutosAutomaticos();
