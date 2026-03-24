// ── Helpers ──────────────────────────────────────────────────
async function apiAuth(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
    ...(options.headers || {})
  };
  const res  = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

// ── Preencher select de produtos ─────────────────────────────
async function preencherSelectProdutos() {
  const sel = document.getElementById('selectProduto');
  if (!sel) return;

  try {
    const produtos = await apiAuth('/api/produtos');
    sel.innerHTML = '<option value="">Selecione um produto</option>';
    for (const p of produtos) {
      const opt = document.createElement('option');
      opt.value       = p._id;
      opt.textContent = p.nome;
      sel.appendChild(opt);
    }
  } catch (e) {
    toastErro('Erro ao carregar produtos: ' + e.message);
  }
}

// ── Confirmar ENTRADA ────────────────────────────────────────
async function confirmarEntrada() {
  const produtoId  = document.getElementById('selectProduto')?.value;
  const quantidade = Number(document.getElementById('inputQtd')?.value || 0);
  const observacao = (document.getElementById('inputObs')?.value || '').trim();

  if (!produtoId || quantidade <= 0) {
    toastErro('Informe produto e quantidade > 0');
    return;
  }

  try {
    await apiAuth('/api/estoque/entradas', {
      method: 'POST',
      body: JSON.stringify({ produtoId, quantidade, observacao })
    });
    toastOk('Entrada registrada!');
    await carregarMovimentos();
  } catch (e) {
    toastErro(e.message);
  }
}

// ── Confirmar SAÍDA ──────────────────────────────────────────
async function confirmarSaida() {
  const produtoId  = document.getElementById('selectProduto')?.value;
  const quantidade = Number(document.getElementById('inputQtd')?.value || 0);
  const observacao = (document.getElementById('inputObs')?.value || '').trim();

  if (!produtoId || quantidade <= 0) {
    toastErro('Informe produto e quantidade > 0');
    return;
  }

  try {
    await apiAuth('/api/estoque/saidas', {
      method: 'POST',
      body: JSON.stringify({ produtoId, quantidade, observacao })
    });
    toastOk('Saída registrada!');
    await carregarMovimentos();
  } catch (e) {
    toastErro(e.message);
  }
}

// ── Listar movimentos ────────────────────────────────────────
async function carregarMovimentos() {
  const corpo = document.getElementById('tbodyMovs');
  if (!corpo) return;

  try {
    const token = localStorage.getItem('token');
    const res   = await fetch('/api/estoque/movimentos', {
      headers: { Authorization: 'Bearer ' + token }
    });

    if (!res.ok) {
      corpo.innerHTML = '<tr><td colspan="5">Nenhuma movimentação</td></tr>';
      return;
    }

    const raw  = await res.json();
    const itens = Array.isArray(raw) ? raw : (raw.itens || []);

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
    if (corpo) corpo.innerHTML = `<tr><td colspan="5" style="color:#fca5a5;">Erro: ${e.message}</td></tr>`;
  }
}

// ── Scanner de código de barras (opcional) ───────────────────
function iniciarScanner() {
  const scannerInput = document.getElementById('scannerInput');
  if (!scannerInput) return; // Sem o campo no HTML, ignora

  let buffer = '';
  scannerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      buscarProdutoPorCodigo?.(buffer);
      buffer = '';
    } else {
      buffer += e.key;
    }
  });
}

// ── Toasts ───────────────────────────────────────────────────
function toastOk(msg)   { console.log(msg); }
function toastErro(msg) { console.error(msg); alert('Erro: ' + msg); }

// ── Init ─────────────────────────────────────────────────────
(function init() {
  document.getElementById('btnConfirmarEntrada')
    ?.addEventListener('click', confirmarEntrada);

  document.getElementById('btnConfirmarSaida')
    ?.addEventListener('click', confirmarSaida);

  preencherSelectProdutos();
  carregarMovimentos();
  iniciarScanner();
})();
