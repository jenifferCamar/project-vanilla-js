# Pong Blocks

Pong Blocks e um jogo de quebra-blocos desenvolvido como uma aplicacao web em Vanilla JavaScript. O jogador controla uma barra para rebater a bolinha, destruir os blocos, marcar pontos e avancar por diferentes niveis.

## Deploy

Acesse a versao publicada na Vercel:

**[Jogar Pong Blocks](https://project-vanilla-js.vercel.app)**

## Sobre o projeto

O projeto foi criado para a Atividade 01, utilizando apenas as tecnologias fundamentais da web:

- HTML5 para a estrutura da pagina;
- CSS3 para o layout, responsividade e identidade visual;
- JavaScript para a logica do jogo, controles, pontuacao e efeitos;
- Canvas API para desenhar a arena, blocos, barra, bolinhas e particulas;
- Vercel para o deploy da aplicacao estatica.

## Funcionalidades

- Sistema de pontuacao e recorde salvo no navegador;
- Tres vidas por partida;
- Fases com dificuldade progressiva;
- Blocos reforcados nos niveis avancados;
- Quatro poderes: barra larga, multibola, camera lenta e vida extra;
- Efeitos sonoros, particulas e animacoes;
- Controles por mouse, toque e teclado;
- Pausar, reiniciar e acessar em tela cheia;
- Layout responsivo para computador e celular.

## Controles

- **Setas esquerda e direita** ou **A e D**: mover a barra;
- **Mouse**: mover a barra pela arena;
- **Botoes na tela**: controlar a barra em dispositivos moveis;
- **P** ou **Esc**: pausar ou continuar;
- **Espaco**: iniciar, continuar ou reiniciar a partida.

## Executar localmente

Como o projeto nao possui etapa de compilacao, basta abrir o arquivo `index.html` no navegador.

Tambem e possivel iniciar um servidor local simples com qualquer servidor estatico. Por exemplo, usando a extensao Live Server no VS Code.

## Estrutura

```text
project-vanilla-js/
├── index.html    # Estrutura da aplicacao
├── style.css     # Estilos e responsividade
├── script.js     # Logica e funcionamento do jogo
├── vercel.json   # Configuracao do deploy
└── package.json  # Metadados do projeto
```