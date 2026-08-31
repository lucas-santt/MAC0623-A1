# How to run

Inside src folder, write the following command into your terminal:

`python3 -m http.server 8000`

After the server's up, write this addres into your browser: `http://127.0.0.1:8000/`

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

Com o teclado

#### Why?

O movimento é mais preciso, o mouse tem mais variações que atrapalham

## P02

#### Which felt best?

Com o teclado

#### Why?

O movimento é mais preciso, se fosse mouse seria melhor, o trackpad perde muita precisão

## P03

#### Which felt best?

Keyboard.

#### Why?

First off, the mouse was better. But after understading the second mapping, it felt best. It has a higher skill ceiling and was more intuitive.