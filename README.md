# How to run

Inside src folder, write the following command into your terminal:

`python3 -m http.server 8000`

After the server's up, write this addres into your browser: `http://127.0.0.1:8000/`

## Public static page website

To avoid running locally, you can visit the [project static page website](https://lucas-santt.github.io/MAC0623-A1/)

# Implementation decisions 

## Layers

For optimization and a cleaner code, it was enabled layering in the main scene for filtering objects when raycasting.

Only the cube has a layer of 1 so, when we raycast from the cursor position, the raycaster only checks for intersections with layer 1.

## Rotation

All of cube's rotation gimmicks were made based on world axis because of personal preference.

# Experiments:

- P01: Started on mapping 1
- P02: Started on mapping 2
- P03: Started on mapping 1
- P04: Started on mapping 2
- P05: Started on mapping 1

## P01

#### Which felt best?

Keyboard

#### Why?

> O movimento é mais preciso, o mouse tem mais variações que atrapalham

## P02

#### Which felt best?

Com o teclado

#### Why?

> O movimento é mais preciso, se fosse mouse seria melhor, o trackpad perde muita precisão

## P03

#### Which felt best?

Keyboard.

#### Why?

> First off, the mouse was better. But after understading the second mapping, it felt best. It has a higher skill ceiling and was more intuitive.

## P04

##### Which felt best?

Keyboard.

##### Why?

> Mais fácil de ajustar a sensibilidade

## P05

#### Which felt best?

Keyboard

##### Why?

> A distribuição das teclas é mais intuitiva

## Script

For each participant, a script was read to explain the task to each participant. This was realized to avoid bias in the experiments. The script was written and read in portuguese.

Você vai ver um cubo no meio da tela e um objetivo na tela. O objetivo é outro cubo transparente onde você vai ter que levar o seu cubo sólido para esse objetivo alterando a sua posição e rotação de acordo com as suas cores.

Em cima, à direita da tela, temos a distância de posição e rotação do seu cubo sólido ao objetivo. Quando essas informações ficarem verde, quer dizer que você conseguiu atingir o objetivo. Desse modo, ao alcançá-lo basta você pressionar Enter para prosseguir para a próxima rodada.

Para fazer isso, teremos dois tipos de controle que você vai testar dessa maneira:

- 1 Rodada para acostumar com o controle
- 3 Rodadas "sérias"

Durante a realização dos testes, você pode parar de realizá-los a sua prefêrencia se sentir necessidade

### Primeiro controle

Você vai controlar a posição e a rotação movimentando o mouse e o scroll (rodinha) do mouse. 

Para a posição, o movimento do mouse controla o movimento horizontal e vertical do cubo, enquanto que o scroll (rodinha) controla o cubo indo para frente ou para trás

Para a rotação, o movimento do mouse controla a rotação para a direita e para a esquerda do cubo e a sua rotação para frente e para trás, enquanto que o scroll faz a rotação de maçaneta (pode demonstrar com movimentos da mão) do cubo

Para alterar entre posição e rotação, basta apertar Tab ou a barra de espaço do teclado.

### Segundo controle

Você vai controlar a posição e a rotação apenas no teclado. 

Para a posição, vai utilizar as teclas w, a, s, d para fazer o cubo ir para o lado e para cima e as teclas r, f para fazer o cubo ir pra trás ou para a frente

Para a rotação, vai utilizar as teclas u, o para rodar o cubo como uma maçaneta (apresentando o movimento com a mão), j, l para rodar o cubo para a direita/esquerda e i, k para frente ou para trás