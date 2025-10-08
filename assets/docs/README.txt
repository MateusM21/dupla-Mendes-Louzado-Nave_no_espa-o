Nave Infinita – README

Sobre o jogo

Nave Infinita é um jogo de nave 2D no estilo arcade, onde o jogador controla uma nave que deve desviar e destruir naves inimigas enquanto percorre uma distância infinita. O objetivo é sobreviver o máximo possível e acumular pontos destruindo inimigos.

Controles:

Setas do teclado ou WASD: mover a nave.

Espaço: atirar.


Mecânicas:

Cada inimigo destruído aumenta a pontuação.

O jogador tem 1 vida; colisões com inimigos ou tiros inimigos resultam em fim de jogo.

A velocidade do jogo aumenta progressivamente.

O jogo termina ao perder a vida, mostrando a tela de Game Over com a distância percorrida.


Sons:

O jogo conta com efeitos sonoros para melhorar a experiência:

Tiro do jogador: shoot.mp3

Tiro inimigo: enemyShoot.mp3


Certifique-se de que os arquivos de áudio estejam na mesma pasta do jogo para funcionar corretamente.


Ranking:

Os melhores scores são armazenados localmente no navegador usando localStorage.

É possível limpar o ranking clicando no botão correspondente.

Estrutura do código

Canvas: renderiza o jogo.

Player e Enemy: entidades do jogo com colisões.

Colisor: sistema AABB para detectar colisões.

ParallaxLayer: cria o efeito de estrelas em movimento.

Game Loop: atualiza e desenha o jogo a cada frame.

Botões: para iniciar o jogo e voltar ao menu.

Créditos

Desenvolvedor: Mateus Mendes & Isabella Louzado & ChatGPT