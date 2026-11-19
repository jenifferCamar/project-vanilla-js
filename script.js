const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status-text');
const pauseIndicator = document.getElementById('pause-indicator');
const btnReiniciar = document.getElementById('btn-reiniciar');

const TECLAS = {
  CIMA: ['ArrowUp', 'w', 'W'],
  BAIXO: ['ArrowDown', 's', 'S'],
  ESQUERDA: ['ArrowLeft', 'a', 'A'],
  DIREITA: ['ArrowRight', 'd', 'D'],
  PAUSA: [' '],
};

const estado = {
  x: 275,
  y: 175,
  tamanho: 50,
  velocidade: 4,
  cor: '#38bdf8',
  direcao: 'parado',
  pressionadas: {},
  pausado: false,
  xInicial: 275,
  yInicial: 175,
};

function teclaEh(tecla, grupo) {
  return TECLAS[grupo].includes(tecla);
}

window.addEventListener('keydown', (e) => {
  if (teclaEh(e.key, 'PAUSA')) {
    estado.pausado = !estado.pausado;
    pauseIndicator.classList.toggle('hidden', !estado.pausado);
    statusText.textContent = estado.pausado ? 'Jogo pausado — pressione Espaço para continuar' : 'Jogo retomado';
    return;
  }

  if (estado.pausado) return;

  estado.pressionadas[e.key] = true;
  atualizarDirecao();
});

window.addEventListener('keyup', (e) => {
  delete estado.pressionadas[e.key];
  atualizarDirecao();
});

btnReiniciar.addEventListener('click', () => {
  estado.x = estado.xInicial;
  estado.y = estado.yInicial;
  estado.direcao = 'parado';
  estado.pressionadas = {};
  estado.pausado = false;
  pauseIndicator.classList.add('hidden');
  statusText.textContent = 'Reiniciado — pronto para mover';
});

function atualizarDirecao() {
  const cima = teclaGrupoPressionada('CIMA');
  const baixo = teclaGrupoPressionada('BAIXO');
  const esquerda = teclaGrupoPressionada('ESQUERDA');
  const direita = teclaGrupoPressionada('DIREITA');

  if (!cima && !baixo && !esquerda && !direita) {
    estado.direcao = 'parado';
    statusText.textContent = 'Pronto para mover';
    return;
  }

  const partes = [];
  if (cima) partes.push('cima');
  if (baixo) partes.push('baixo');
  if (esquerda) partes.push('esquerda');
  if (direita) partes.push('direita');

  estado.direcao = partes.join('-');
  statusText.textContent = `Movendo: ${estado.direcao}`;
}

function teclaGrupoPressionada(grupo) {
  return TECLAS[grupo].some((t) => estado.pressionadas[t]);
}

function mover() {
  if (estado.pausado || estado.direcao === 'parado') return;

  const direcoes = estado.direcao.split('-');

  if (direcoes.includes('cima')) estado.y -= estado.velocidade;
  if (direcoes.includes('baixo')) estado.y += estado.velocidade;
  if (direcoes.includes('esquerda')) estado.x -= estado.velocidade;
  if (direcoes.includes('direita')) estado.x += estado.velocidade;

  estado.x = Math.max(0, Math.min(canvas.width - estado.tamanho, estado.x));
  estado.y = Math.max(0, Math.min(canvas.height - estado.tamanho, estado.y));
}

function desenhar() {
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  const centroX = canvas.width / 2 - estado.tamanho / 2;
  const centroY = canvas.height / 2 - estado.tamanho / 2;

  ctx.fillStyle = '#475569';
  ctx.fillRect(centroX, centroY, estado.tamanho, estado.tamanho);

  ctx.fillStyle = estado.cor;
  ctx.fillRect(estado.x, estado.y, estado.tamanho, estado.tamanho);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`Posição: (${estado.x}, ${estado.y})`, canvas.width / 2, 30);

  if (estado.pausado) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 24px system-ui';
    ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui';
    ctx.fillText('Pressione Espaço para continuar', canvas.width / 2, canvas.height / 2 + 30);
  }
}

function loop() {
  mover();
  desenhar();
  requestAnimationFrame(loop);
}

loop();
