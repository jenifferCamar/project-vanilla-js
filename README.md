# Pong Blocks

Pong Blocks é um jogo de quebra-blocos desenvolvido como uma aplicação web em Vanilla JavaScript. O jogador controla uma barra para rebater a bolinha, destruir os blocos, marcar pontos e avançar por diferentes níveis.

## Deploy

Acesse a versão publicada na Vercel:

**[Jogar Pong Blocks](https://pong-blocks.vercel.app)**

O repositório está conectado ao GitHub:

**[github.com/jenifferCamar/project-vanilla-js](https://github.com/jenifferCamar/project-vanilla-js)**

## Sobre o projeto

O projeto foi criado para a Atividade 01, utilizando apenas as tecnologias fundamentais da web:

- HTML5 para a estrutura da página;
- CSS3 para o layout, responsividade e identidade visual;
- JavaScript para a lógica do jogo, controles, pontuação e efeitos;
- Canvas API para desenhar a arena, blocos, barra, bolinhas e partículas;
- Vercel para o deploy da aplicação estática.

## Funcionalidades

- Sistema de pontuação e recorde salvo no navegador;
- Três vidas por partida;
- Fases com dificuldade progressiva;
- Blocos reforçados nos níveis avançados;
- Quatro poderes: barra larga, multibola, câmera lenta e vida extra;
- Efeitos sonoros, partículas e animações;
- Controles por mouse, toque e teclado;
- Pausar, reiniciar e acessar em tela cheia;
- Layout responsivo para computador e celular.

## Controles

- **Setas esquerda e direita** ou **A e D**: mover a barra;
- **Mouse**: mover a barra pela arena;
- **Botões na tela**: controlar a barra em dispositivos móveis;
- **P** ou **Esc**: pausar ou continuar;
- **Espaço**: iniciar, continuar ou reiniciar a partida.

## Executar localmente

Como o projeto não possui etapa de compilação, basta abrir o arquivo `index.html` no navegador.

Para iniciar um servidor local:

```bash
npm run dev
```

Também é possível abrir o `index.html` diretamente no navegador. Para validar a sintaxe do JavaScript pelo terminal:

```bash
npm run check
```

## Publicar alterações

1. Faça as alterações no VS Code.
2. Verifique o projeto com `npm run check`.
3. Envie as alterações para o GitHub:

```bash
git add .
git commit -m "melhora a aplicação"
git push origin main
```

Com o projeto importado na Vercel, cada push para `main` cria um novo deploy automaticamente. Como a aplicação é estática, não há build command nem diretório de saída adicional.

## Estrutura

```text
project-vanilla-js/
├── index.html    # Estrutura da aplicação
├── style.css     # Estilos e responsividade
├── script.js     # Lógica e funcionamento do jogo
├── vercel.json   # Configuração do deploy
├── package.json  # Metadados e comandos do projeto
└── package-lock.json # Versões reproduzíveis das dependências
```