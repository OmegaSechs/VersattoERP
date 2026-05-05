// ─────────────────────────────────────────────────────────────
//  validators.js  —  Funções de validação / sanitização
// ─────────────────────────────────────────────────────────────

function apenasInteiro(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function apenasDecimal(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function sanitizarString(val, maxLen = 200) {
  if (val === undefined || val === null) return null;
  return String(val).trim().slice(0, maxLen) || null;
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarData(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : d;
}

function validarHora(h) {
  if (!h) return null;
  return /^\d{2}:\d{2}(:\d{2})?$/.test(h) ? h : null;
}

// Lança 400 se algum campo obrigatório estiver faltando
function exigir(campos, body, reply) {
  for (const campo of campos) {
    if (body[campo] === undefined || body[campo] === null || body[campo] === '') {
      reply.code(400).send({ erro: `Campo obrigatório ausente: ${campo}` });
      return false;
    }
  }
  return true;
}

module.exports = {
  apenasInteiro,
  apenasDecimal,
  sanitizarString,
  validarEmail,
  validarData,
  validarHora,
  exigir,
};
