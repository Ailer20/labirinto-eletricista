# Changelog - Modo Multiplayer

## Versão 2.0 - Modo Multiplayer Implementado

### 🎮 Novas Funcionalidades

#### 1. Tela de Seleção de Modo
- Adicionada tela inicial com opções de **Singleplayer** e **Multiplayer**
- Interface visual atrativa com botões grandes e descrições claras
- Possibilidade de voltar ao menu principal a qualquer momento através do botão "Menu"

#### 2. Modo Multiplayer
- **Dois jogadores simultâneos** no mesmo labirinto
- Cada jogador tem seu próprio personagem:
  - **Jogador 1**: 👷‍♂️ (Eletricista 1) - Posição inicial: superior esquerda
  - **Jogador 2**: 👷‍♀️ (Eletricista 2) - Posição inicial: inferior esquerda
- **Objetivo cooperativo**: Ambos os jogadores devem chegar ao psicólogo (🧠) para vencer
- Os jogadores não podem ocupar a mesma célula
- Se um jogador tocar em uma distração, o jogo termina para ambos

#### 3. Controles

##### Jogador 1
- **Teclado**: WASD ou Setas direcionais (↑↓←→)
- **Gamepad 1**: D-Pad ou Analógico esquerdo

##### Jogador 2 (apenas em multiplayer)
- **Teclado**: IJKL
  - I = Cima
  - K = Baixo
  - J = Esquerda
  - L = Direita
- **Gamepad 2**: D-Pad ou Analógico esquerdo

#### 4. Suporte a Dois Controles
- Sistema de detecção automática de gamepads
- Atribuição inteligente de controles aos jogadores:
  - Primeiro controle conectado = Jogador 1
  - Segundo controle conectado = Jogador 2
- Notificações visuais quando controles são conectados/desconectados
- Cada controle opera de forma independente

### 🔧 Modificações Técnicas

#### Arquivos Modificados

##### `index.html`
- Adicionada div `mode-selection` para tela de seleção
- Adicionados controles móveis para o Jogador 2
- Atualizada legenda para mostrar ambos os jogadores
- Adicionado botão "Menu" para voltar à seleção de modo
- Elementos do jogo agora ficam ocultos até que um modo seja selecionado

##### `style.css`
- Novos estilos para tela de seleção de modo
- Estilos para o segundo jogador (`.player2`, `.legend-icon.player2`)
- Layout responsivo para controles de dois jogadores
- Animações e efeitos visuais para os botões de seleção

##### `script.js`
- Classe `MazeGame` agora aceita parâmetro `mode` ('singleplayer' ou 'multiplayer')
- Adicionadas propriedades:
  - `gameMode`: Armazena o modo atual
  - `player2Pos`: Posição do segundo jogador
  - `player1Finished`: Flag indicando se jogador 1 chegou ao objetivo
  - `player2Finished`: Flag indicando se jogador 2 chegou ao objetivo
- Método `movePlayer()` modificado para aceitar parâmetro `player` (1 ou 2)
- Lógica de vitória adaptada para modo cooperativo
- Método `updateModeUI()` para atualizar interface baseada no modo
- Função `startGame(mode)` para iniciar o jogo com modo selecionado
- Função `backToMenu()` para retornar à tela de seleção
- Event listeners para teclas IJKL (controles do jogador 2)

##### `gamepad.js`
- Adicionado sistema de atribuição de gamepads a jogadores
- Propriedade `gamepadAssignments`: Mapeia índice do gamepad para número do jogador
- Propriedade `analogMoveDelay`: Controla velocidade de movimento analógico
- Método `assignGamepadToPlayer()`: Atribui automaticamente gamepads aos jogadores
- Método `handleButtonPress()` e `handleAnalogMovement()` modificados para identificar qual jogador está usando o controle
- Notificações mostram qual jogador conectou/desconectou o controle

### 📋 Regras do Modo Multiplayer

1. **Início**: Ambos os jogadores começam em posições diferentes do labirinto
2. **Movimento**: Cada jogador se move independentemente
3. **Colisão**: Jogadores não podem ocupar a mesma célula
4. **Distrações**: Se qualquer jogador tocar uma distração, ambos perdem
5. **Vitória**: Ambos os jogadores devem chegar ao psicólogo (🧠) para vencer
6. **Pontuação**: Compartilhada entre os jogadores (10 pontos por movimento, 100 ao chegar no objetivo)

### 🎯 Compatibilidade

- ✅ Navegadores modernos (Chrome, Firefox, Edge, Safari)
- ✅ Dispositivos móveis (controles touch)
- ✅ Teclado (WASD/Setas para P1, IJKL para P2)
- ✅ Controles Xbox, PlayStation e compatíveis
- ✅ Até 2 controles simultâneos

### 🚀 Como Usar

1. Abra o arquivo `index.html` no navegador
2. Selecione o modo de jogo:
   - **Singleplayer**: Jogue sozinho
   - **Multiplayer**: Jogue com um amigo
3. Use os controles para mover os eletricistas
4. Evite as distrações e chegue ao psicólogo!
5. Use o botão "Menu" para voltar e trocar de modo

### 📝 Notas

- O modo singleplayer mantém todas as funcionalidades originais
- No modo multiplayer, a experiência é cooperativa
- Os controles são intuitivos e fáceis de aprender
- Perfeito para dinâmicas em grupo e trabalho em equipe!

---

**Desenvolvido para dinâmica empresarial** 🏢
