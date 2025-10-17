// ====== helpers ======
async function apiNoAuth(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

// ====== preencher select de produtos ======
async function preencherSelectProdutos() {
  const sel = document.getElementById('selectProduto');
  if (!sel) return;

  const produtos = await apiNoAuth('/api/produtos'); // sua rota já existente
  sel.innerHTML = '';
  for (const p of produtos) {
    const opt = document.createElement('option');
    opt.value = p._id;              // IMPORTANTÍSSIMO: value = _id
    opt.textContent = p.nome;
    sel.appendChild(opt);
  }
}

// ====== confirmar ENTRADA ======
async function confirmarEntrada() {
  const produtoId = document.getElementById('selectProduto')?.value;
  const quantidade = Number(document.getElementById('inputQtd')?.value || 0);
  const observacao = (document.getElementById('inputObs')?.value || '').trim();

  if (!produtoId || !quantidade || quantidade <= 0) {
    toastErro('Informe produto e quantidade > 0');
    return;
  }

  try {
    await apiNoAuth('/api/estoque/entradas', {
      method: 'POST',
      body: JSON.stringify({ produtoId, quantidade, observacao })
    });
    toastOk('Entrada registrada!');
    await carregarMovimentos();
    // se você tiver função para fechar o modal/limpar campos, chame aqui
  } catch (e) {
    toastErro(e.message);
  }
}

// ====== confirmar SAÍDA (se tiver botão de saída) ======
async function confirmarSaida() {
  const produtoId = document.getElementById('selectProduto')?.value;
  const quantidade = Number(document.getElementById('inputQtd')?.value || 0);
  const observacao = (document.getElementById('inputObs')?.value || '').trim();

  if (!produtoId || !quantidade || quantidade <= 0) {
    toastErro('Informe produto e quantidade > 0');
    return;
  }

  try {
    await apiNoAuth('/api/estoque/saidas', {
      method: 'POST',
      body: JSON.stringify({ produtoId, quantidade, observacao })
    });
    toastOk('Saída registrada!');
    await carregarMovimentos();
  } catch (e) {
    toastErro(e.message);
  }
}

// ====== listar movimentos na tabela ======
async function carregarMovimentos() {
  const corpo = document.getElementById('tbodyMovs'); // <tbody id="tbodyMovs">
  if (!corpo) return;
  try {
    const { itens = [] } = await apiNoAuth('/api/estoque/movimentos')
      .catch(async (x) => {
        // se sua rota retorna array puro e não objeto:
        const arr = await apiNoAuth('/api/estoque/movimentos');
        return { itens: Array.isArray(arr) ? arr : [] };
      });

    corpo.innerHTML = '';
    if (!itens.length) {
      corpo.innerHTML = '<tr><td colspan="5">Nenhuma movimentação</td></tr>';
      return;
    }

    for (const m of itens) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(m.createdAt).toLocaleString('pt-BR')}</td>
        <td>${m.produto?.nome || '-'}</td>
        <td>${m.tipo}</td>
        <td>${m.quantidade}</td>
        <td>${m.observacao || ''}</td>
      `;
      corpo.appendChild(tr);
    }
  } catch (e) {
    corpo.innerHTML = `<tr><td colspan="5" style="color:#fca5a5;">Erro: ${e.message}</td></tr>`;
  }
}

// ====== toasts simples (substitua pelo seu sistema) ======
function toastOk(msg){ console.log(msg); }
function toastErro(msg){ console.error(msg); alert('Erro: ' + msg); }

// ====== ligar botões se existirem ======
(function init(){
  document.getElementById('btnConfirmarEntrada')
    ?.addEventListener('click', confirmarEntrada);

  document.getElementById('btnConfirmarSaida')
    ?.addEventListener('click', confirmarSaida);

  preencherSelectProdutos();
  carregarMovimentos();
})();
