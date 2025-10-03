// Classe para gerenciar controles de gamepad (Xbox, PlayStation, etc.)
class GamepadManager {
    constructor(game) {
        this.game = game;
        this.gamepads = {};
        this.gamepadAssignments = {}; // Mapeia gamepad index para player (1 ou 2)
        this.isPolling = false;
        this.pollInterval = null;
        this.deadzone = 0.3; // Zona morta para analógicos
        this.buttonPressed = {}; // Rastreia botões pressionados para evitar repetição
        this.analogMoveDelay = {}; // Delay para movimento analógico
        this.analogMoveThreshold = 200; // ms entre movimentos analógicos
        
        // Mapeamento de botões para controle Xbox
        this.buttonMap = {
            0: 'A',        // A
            1: 'B',        // B
            2: 'X',        // X
            3: 'Y',        // Y
            4: 'LB',       // Left Bumper
            5: 'RB',       // Right Bumper
            6: 'LT',       // Left Trigger
            7: 'RT',       // Right Trigger
            8: 'Back',     // Back/Select
            9: 'Start',    // Start/Menu
            10: 'LS',      // Left Stick
            11: 'RS',      // Right Stick
            12: 'Up',      // D-Pad Up
            13: 'Down',    // D-Pad Down
            14: 'Left',    // D-Pad Left
            15: 'Right'    // D-Pad Right
        };
        
        this.init();
    }
    
    init() {
        // Event listeners para conexão/desconexão de gamepads
        window.addEventListener('gamepadconnected', (e) => {
            this.onGamepadConnected(e);
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            this.onGamepadDisconnected(e);
        });
        
        // Verifica se já há gamepads conectados
        this.checkExistingGamepads();
        
        // Inicia o polling
        this.startPolling();
    }
    
    checkExistingGamepads() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.addGamepad(gamepads[i]);
            }
        }
    }
    
    onGamepadConnected(event) {
        console.log('Gamepad conectado:', event.gamepad.id);
        this.addGamepad(event.gamepad);
        
        // Atribui automaticamente o controle ao próximo jogador disponível
        const playerNumber = this.assignGamepadToPlayer(event.gamepad.index);
        this.showGamepadNotification(Controle ${playerNumber} conectado: ${event.gamepad.id}, 'success');
    }
    
    onGamepadDisconnected(event) {
        console.log('Gamepad desconectado:', event.gamepad.id);
        const playerNumber = this.gamepadAssignments[event.gamepad.index];
        this.removeGamepad(event.gamepad);
        this.showGamepadNotification(Controle ${playerNumber} desconectado: ${event.gamepad.id}, 'warning');
    }
    
    addGamepad(gamepad) {
        this.gamepads[gamepad.index] = gamepad;
        // Inicializa o estado dos botões para este gamepad
        this.buttonPressed[gamepad.index] = {};
        this.analogMoveDelay[gamepad.index] = {
            lastMoveTime: 0,
            lastDirection: null
        };
    }
    
    removeGamepad(gamepad) {
        delete this.gamepads[gamepad.index];
        delete this.buttonPressed[gamepad.index];
        delete this.gamepadAssignments[gamepad.index];
        delete this.analogMoveDelay[gamepad.index];
    }
    
    assignGamepadToPlayer(gamepadIndex) {
        // Se já está atribuído, retorna o jogador existente
        if (this.gamepadAssignments[gamepadIndex]) {
            return this.gamepadAssignments[gamepadIndex];
        }
        
        // Atribui ao primeiro jogador disponível
        const assignedPlayers = Object.values(this.gamepadAssignments);
        
        if (!assignedPlayers.includes(1)) {
            this.gamepadAssignments[gamepadIndex] = 1;
            return 1;
        } else if (!assignedPlayers.includes(2) && this.game.gameMode === 'multiplayer') {
            this.gamepadAssignments[gamepadIndex] = 2;
            return 2;
        } else {
            // Se ambos os jogadores já têm controles, atribui ao jogador 1 por padrão
            this.gamepadAssignments[gamepadIndex] = 1;
            return 1;
        }
    }
    
    startPolling() {
        if (!this.isPolling) {
            this.isPolling = true;
            this.pollInterval = setInterval(() => {
                this.pollGamepads();
            }, 16); // ~60 FPS
        }
    }
    
    stopPolling() {
        if (this.isPolling) {
            this.isPolling = false;
            clearInterval(this.pollInterval);
        }
    }
    
    pollGamepads() {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad && this.gamepads[gamepad.index]) {
                this.processGamepadInput(gamepad);
            }
        }
    }
    
    processGamepadInput(gamepad) {
        // Processa botões
        this.processButtons(gamepad);
        
        // Processa analógicos
        this.processAnalogSticks(gamepad);
    }
    
    processButtons(gamepad) {
        for (let i = 0; i < gamepad.buttons.length; i++) {
            const button = gamepad.buttons[i];
            const buttonName = this.buttonMap[i] || Button${i};
            const wasPressed = this.buttonPressed[gamepad.index][i] || false;
            const isPressed = button.pressed;
            
            // Detecta quando o botão é pressionado (não estava pressionado antes)
            if (isPressed && !wasPressed) {
                this.handleButtonPress(buttonName, gamepad.index);
            }
            
            // Atualiza o estado do botão
            this.buttonPressed[gamepad.index][i] = isPressed;
        }
    }
    
    processAnalogSticks(gamepad) {
        // Stick esquerdo (movimento)
        const leftX = gamepad.axes[0];
        const leftY = gamepad.axes[1];
        
        // Aplica zona morta
        if (Math.abs(leftX) > this.deadzone || Math.abs(leftY) > this.deadzone) {
            this.handleAnalogMovement(leftX, leftY, gamepad.index);
        }
        
        // Stick direito (pode ser usado para outras funções no futuro)
        const rightX = gamepad.axes[2];
        const rightY = gamepad.axes[3];
        
        // Triggers como eixos (alguns controles)
        if (gamepad.axes.length > 4) {
            const leftTrigger = gamepad.axes[4];
            const rightTrigger = gamepad.axes[5];
            // Pode ser usado para funcionalidades futuras
        }
    }
    
    handleButtonPress(buttonName, gamepadIndex) {
        // Só processa se o jogo estiver no estado correto
        if (!this.game) return;
        
        // Determina qual jogador está usando este controle
        const playerNumber = this.gamepadAssignments[gamepadIndex] || 1;
        
        switch (buttonName) {
            case 'Up':
                this.game.movePlayer(0, -1, playerNumber);
                break;
            case 'Down':
                this.game.movePlayer(0, 1, playerNumber);
                break;
            case 'Left':
                this.game.movePlayer(-1, 0, playerNumber);
                break;
            case 'Right':
                this.game.movePlayer(1, 0, playerNumber);
                break;
            case 'A':
                // Botão A pode ser usado para confirmar/selecionar
                this.handleActionButton();
                break;
            case 'B':
                // Botão B pode ser usado para cancelar/voltar
                this.handleCancelButton();
                break;
            case 'Start':
                // Botão Start para pausar/despausar
                this.game.togglePause();
                break;
            case 'Back':
                // Botão Back para reiniciar
                this.game.restartGame();
                break;
            case 'X':
                // Botão X para reiniciar
                this.game.restartGame();
                break;
            case 'Y':
                // Botão Y pode ser usado para outras funções
                break;
            default:
                console.log(Botão ${buttonName} pressionado no gamepad ${gamepadIndex} (Jogador ${playerNumber}));
        }
    }
    
    handleAnalogMovement(x, y, gamepadIndex) {
        // Converte movimento analógico em movimento digital
        // Só processa se o jogo estiver no estado correto
        if (!this.game || this.game.gameState !== 'playing') return;
        
        // Determina qual jogador está usando este controle
        const playerNumber = this.gamepadAssignments[gamepadIndex] || 1;
        
        // Verifica delay para evitar movimentos muito rápidos
        const now = Date.now();
        const delay = this.analogMoveDelay[gamepadIndex];
        
        // Determina a direção predominante
        let direction = null;
        let dx = 0, dy = 0;
        
        if (Math.abs(x) > Math.abs(y)) {
            // Movimento horizontal
            if (x > this.deadzone) {
                direction = 'right';
                dx = 1;
            } else if (x < -this.deadzone) {
                direction = 'left';
                dx = -1;
            }
        } else {
            // Movimento vertical
            if (y > this.deadzone) {
                direction = 'down';
                dy = 1;
            } else if (y < -this.deadzone) {
                direction = 'up';
                dy = -1;
            }
        }
        
        // Só move se passou tempo suficiente desde o último movimento
        // ou se mudou de direção
        if (direction && 
            (now - delay.lastMoveTime > this.analogMoveThreshold || 
             direction !== delay.lastDirection)) {
            this.game.movePlayer(dx, dy, playerNumber);
            delay.lastMoveTime = now;
            delay.lastDirection = direction;
        }
    }
    
    handleActionButton() {
        // Lógica para botão de ação (A)
        if (!this.game) return;
        
        // Se há um modal aberto, tenta clicar no botão principal
        if (this.game.gameState === 'gameOver') {
            // Reinicia o jogo
            this.game.restartGame();
        } else if (this.game.gameState === 'victory') {
            // Próximo nível ou reinicia
            if (this.game.currentLevel < 10) { // Limite arbitrário de níveis
                this.game.nextLevel();
            } else {
                this.game.restartGame();
            }
        } else if (this.game.gameState === 'paused') {
            // Despausa o jogo
            this.game.togglePause();
        }
    }
    
    handleCancelButton() {
        // Lógica para botão de cancelar (B)
        if (!this.game) return;
        
        if (this.game.gameState === 'playing') {
            // Pausa o jogo
            this.game.togglePause();
        } else if (this.game.gameState === 'paused') {
            // Despausa o jogo
            this.game.togglePause();
        }
    }
    
    showGamepadNotification(message, type = 'info') {
        // Cria uma notificação visual para feedback do gamepad
        const notification = document.createElement('div');
        notification.className = gamepad-notification ${type};
        notification.textContent = message;
        
        // Estilos inline para a notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Adiciona animação CSS
        if (!document.querySelector('#gamepad-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'gamepad-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove a notificação após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Método para obter informações sobre gamepads conectados
    getConnectedGamepads() {
        return Object.values(this.gamepads).map(gamepad => ({
            id: gamepad.id,
            index: gamepad.index,
            player: this.gamepadAssignments[gamepad.index],
            connected: gamepad.connected,
            buttons: gamepad.buttons.length,
            axes: gamepad.axes.length
        }));
    }
    
    // Método para verificar se há gamepads conectados
    hasConnectedGamepads() {
        return Object.keys(this.gamepads).length > 0;
    }
    
    // Método para limpar recursos
    destroy() {
        this.stopPolling();
        this.gamepads = {};
        this.buttonPressed = {};
        this.gamepadAssignments = {};
        this.analogMoveDelay = {};
    }
}

// Exporta a classe para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GamepadManager;
}