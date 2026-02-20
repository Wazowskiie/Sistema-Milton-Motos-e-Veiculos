function gerarCodigoEAN13() {
  let codigo = '789';

  for (let i = 0; i < 9; i++) {
    codigo += Math.floor(Math.random() * 10);
  }

  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(codigo[i]) * (i % 2 === 0 ? 1 : 3);
  }

  const digito = (10 - (soma % 10)) % 10;
  return codigo + digito;
}

module.exports = { gerarCodigoEAN13 };
