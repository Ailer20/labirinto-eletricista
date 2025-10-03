// Variável global para armazenar o modo de jogo
let gameMode = null;

// Classe principal do jogo
class MazeGame {
    constructor(mode = 'singleplayer') {
        this.gameMode = mode;
        this.maze = [];
        this.playerPos = { x: 0, y: 0 };
        this.player2Pos = { x: 0, y: 0 };
        this.targetPos = { x: 0, y: 0 };
        this.distractions = [];
        this.gameState = 'playing'; // 'playing', 'paused', 'gameOver', 'victory'
        this.score = 0;
        this.moves = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.currentLevel = 1;
        this.player1Finished = false;
        this.player2Finished = false;
        
        // Sistemas adicionais
        this.soundManager = new SoundManager();
        this.particleSystem = new ParticleSystem();
        this.achievementSystem = new AchievementSystem();
        this.gamepadManager = new GamepadManager(this);
        
        // Elementos DOM
        this.mazeElement = document.getElementById('maze');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.movesElement = document.getElementById('moves');
        
        // Modais
        this.gameOverModal = document.getElementById('game-over-modal');
        this.victoryModal = document.getElementById('victory-modal');
        this.pauseModal = document.getElementById('pause-modal');
        
        // Configurações do labirinto (fixas para o labirinto estático)
        this.mazeWidth = 16;
        this.mazeHeight = 12;
        
        this.setupEventListeners();
        this.init();
    }
    
    init() {
        this.generateMaze();
        this.renderMaze();
        this.startTimer();
        this.updateUI();
        this.updateModeUI();
    }
    
    updateModeUI() {
        if (this.gameMode === 'multiplayer') {
            // Mostra elementos do jogador 2
            document.getElementById('player2-controls').style.display = 'flex';
            document.getElementById('player2-legend').style.display = 'flex';
            document.getElementById('objective-text').textContent = 'Levem os dois eletricistas até o psicólogo evitando as distrações!';
            document.getElementById('player1-label').textContent = 'Eletricista 1';
            document.getElementById('instructions-text').textContent = '💡 Jogador 1: WASD ou Setas | Jogador 2: IJKL ou Controle 2';
        } else {
            // Esconde elementos do jogador 2
            document.getElementById('player2-controls').style.display = 'none';
            document.getElementById('player2-legend').style.display = 'none';
            document.getElementById('objective-text').textContent = 'Leve o eletricista até o psicólogo evitando as distrações!';
            document.getElementById('player1-label').textContent = 'Eletricista (Você)';
            document.getElementById('instructions-text').textContent = '💡 Use as setas do teclado ou controle de Xbox para mover o eletricista';
        }
    }
    
    // Gera um labirinto estático baseado na imagem de referência
    generateMaze() {
        // Define as dimensões fixas do labirinto (16x12 baseado na imagem)
        this.mazeWidth = 16;
        this.mazeHeight = 12;
        
        // Cria o labirinto estático exatamente como na imagem
        this.createStaticMaze();
        
        // Define posição inicial do jogador 1 (segunda linha, segunda coluna)
        this.playerPos = { x: 1, y: 1 };
        this.maze[1][1] = 'player';
        
        // Define posição inicial do jogador 2 (se multiplayer)
        if (this.gameMode === 'multiplayer') {
            this.player2Pos = { x: 1, y: 10 };
            this.maze[10][1] = 'player2';
        }
        
        // Define posição do objetivo (psicólogo) - linha 8, coluna 12 (baseado na imagem)
        this.targetPos = { x: 12, y: 8 };
        this.maze[this.targetPos.y][this.targetPos.x] = 'target';
        
        // Adiciona distrações nas posições específicas da imagem
        this.addStaticDistractions();
    }
    
    // Cria o labirinto estático exatamente como na imagem de referência
    createStaticMaze() {
        // Layout do labirinto baseado na imagem (0 = parede, 1 = caminho) - 16x12
        const mazeLayout = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,0,0,1,0,0,1,1,0,0,1,0,1,0],
            [0,0,1,0,0,1,0,1,1,0,1,0,1,1,1,0],
            [0,1,1,1,1,1,0,0,1,1,1,1,1,0,1,0],
            [0,0,1,0,0,1,1,0,1,0,1,0,0,0,1,0],
            [0,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0],
            [0,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
            [0,1,1,0,1,0,1,0,1,1,1,0,1,0,1,0],
            [0,1,0,0,1,0,1,0,0,0,1,0,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
        
        // Inicializa o labirinto com base no layout
        this.maze = [];
        for (let y = 0; y < this.mazeHeight; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.mazeWidth; x++) {
                this.maze[y][x] = mazeLayout[y][x] === 1 ? 'path' : 'wall';
            }
        }
    }
    
    // Conecta dois pontos com um caminho
    connectPoints(x1, y1, x2, y2) {
        let x = x1, y = y1;
        
        while (x !== x2 || y !== y2) {
            if (x < x2) x++;
            else if (x > x2) x--;
            else if (y < y2) y++;
            else if (y > y2) y--;
            
            if (this.isValidCell(x, y)) {
                this.maze[y][x] = 'path';
            }
        }
    }
    
    // Verifica se a célula é válida
    isValidCell(x, y) {
        return x > 0 && x < this.mazeWidth - 1 && y > 0 && y < this.mazeHeight - 1;
    }
    
    // Embaralha um array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Verifica se uma célula está perto do jogador ou objetivo
    isNearPlayerOrTarget(x, y) {
        const threshold = 2; // Distância mínima para evitar colocar distrações
        const distToPlayer = Math.abs(x - this.playerPos.x) + Math.abs(y - this.playerPos.y);
        const distToTarget = Math.abs(x - this.targetPos.x) + Math.abs(y - this.targetPos.y);
        return distToPlayer <= threshold || distToTarget <= threshold;
    }

    // Adiciona distrações nas posições específicas da imagem
    addStaticDistractions() {
        // Posições das distrações baseadas na imagem de referência 16x12
        const staticDistractions = [
            { x: 8, y: 1, type: '💰' },   
            { x: 2, y: 3, type: '🍺' },   
            { x: 7, y: 3, type: '🎉' },   
            { x: 12, y: 3, type: '💰' },  
            { x: 2, y: 5, type: '🎵' },   
            { x: 6, y: 5, type: '🎉' },  
            { x: 8, y: 5, type: '🎉' },   
            { x: 12, y: 6, type: '💰' },  
            { x: 2, y: 8, type: '🍺' },  
            { x: 6, y: 9, type: '🍺' },  
            { x: 12, y: 10, type: '🍺' },
        ];
        
        this.distractions = [];
        
        // Adiciona cada distração na posição específica
        staticDistractions.forEach(distraction => {
            if (this.maze[distraction.y][distraction.x] === 'path') {
                this.maze[distraction.y][distraction.x] = 'distraction';
                this.distractions.push(distraction);
            }
        });
    }
    
    // Verifica se existe um caminho do ponto de partida ao ponto de destino usando BFS
    hasValidPath(startX, startY, targetX, targetY, currentMaze, avoidDistractions = false) {
        const queue = [{ x: startX, y: startY }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const { x, y } = queue.shift();

            if (x === targetX && y === targetY) {
                return true;
            }

            const neighbors = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];

            for (const { dx, dy } of neighbors) {
                const newX = x + dx;
                const newY = y + dy;

                let cellType = currentMaze[newY][newX];
                if (avoidDistractions && cellType === 'distraction') {
                    continue; // Ignora distrações se estiver procurando um caminho livre
                }

                if (this.isValidCell(newX, newY) && 
                    (cellType === 'path' || cellType === 'target') &&
                    !visited.has(`${newX},${newY}`)) {
                    visited.add(`${newX},${newY}`);
                    queue.push({ x: newX, y: newY });
                }
            }
        }
        return false;
    }

    // Encontra o número de caminhos distintos do início ao fim usando BFS
    countDistinctPaths(startX, startY, targetX, targetY, currentMaze, avoidDistractions = false) {
        let pathCount = 0;
        const queue = [{ x: startX, y: startY, path: new Set([`${startX},${startY}`]) }];
        const maxPathsToCount = 10; // Limita o número de caminhos para evitar sobrecarga

        while (queue.length > 0 && pathCount < maxPathsToCount) {
            const { x, y, path } = queue.shift();

            if (x === targetX && y === targetY) {
                pathCount++;
                continue; 
            }

            const neighbors = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];

            for (const { dx, dy } of neighbors) {
                const newX = x + dx;
                const newY = y + dy;
                const newKey = `${newX},${newY}`;

                let cellType = currentMaze[newY][newX];
                if (avoidDistractions && cellType === 'distraction') {
                    continue; 
                }

                if (this.isValidCell(newX, newY) && 
                    (cellType === 'path' || cellType === 'target') &&
                    !path.has(newKey)) {
                    const newPath = new Set(path);
                    newPath.add(newKey);
                    queue.push({ x: newX, y: newY, path: newPath });
                }
            }
        }
        return pathCount;
    }
    
    // Renderiza o labirinto no DOM
    renderMaze() {
        this.mazeElement.innerHTML = '';
        this.mazeElement.style.gridTemplateColumns = `repeat(${this.mazeWidth}, 1fr)`;
        
        for (let y = 0; y < this.mazeHeight; y++) {
            for (let x = 0; x < this.mazeWidth; x++) {
                const cell = document.createElement('div');
                cell.className = `maze-cell ${this.maze[y][x]}`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // Adiciona ícones
                switch (this.maze[y][x]) {
                    case 'player':
                        cell.textContent = '👷‍♂️';
                        break;
                    case 'player2':
                        cell.textContent = '👷‍♀️';
                        break;
                    case 'target':
                        cell.textContent = '🧠';
                        break;
                    case 'distraction':
                        const distraction = this.distractions.find(d => d.x === x && d.y === y);
                        cell.textContent = distraction ? distraction.type : '🍺';
                        break;
                    case 'wall':
                        cell.textContent = '⬛';
                        break;
                    default:
                        cell.textContent = '';
                }
                
                this.mazeElement.appendChild(cell);
            }
        }
    }
    
    // Remove os event listeners
    removeEventListeners() {
        document.removeEventListener("keydown", this.handleKeyDownBound);
        
        // Controles jogador 1
        if (document.getElementById("up-btn")) {
            document.getElementById("up-btn").removeEventListener("click", this.handleUpClickBound);
        }
        if (document.getElementById("down-btn")) {
            document.getElementById("down-btn").removeEventListener("click", this.handleDownClickBound);
        }
        if (document.getElementById("left-btn")) {
            document.getElementById("left-btn").removeEventListener("click", this.handleLeftClickBound);
        }
        if (document.getElementById("right-btn")) {
            document.getElementById("right-btn").removeEventListener("click", this.handleRightClickBound);
        }
        
        // Controles jogador 2
        if (document.getElementById("up-btn-p2")) {
            document.getElementById("up-btn-p2").removeEventListener("click", this.handleUpClickP2Bound);
        }
        if (document.getElementById("down-btn-p2")) {
            document.getElementById("down-btn-p2").removeEventListener("click", this.handleDownClickP2Bound);
        }
        if (document.getElementById("left-btn-p2")) {
            document.getElementById("left-btn-p2").removeEventListener("click", this.handleLeftClickP2Bound);
        }
        if (document.getElementById("right-btn-p2")) {
            document.getElementById("right-btn-p2").removeEventListener("click", this.handleRightClickP2Bound);
        }
        
        document.getElementById("restart-btn").removeEventListener("click", this.handleRestartClickBound);
        document.getElementById("pause-btn").removeEventListener("click", this.handlePauseClickBound);
        document.getElementById("play-again-btn").removeEventListener("click", this.handleRestartClickBound);
        document.getElementById("close-modal-btn").removeEventListener("click", this.handleCloseModalBound);
        document.getElementById("next-level-btn").removeEventListener("click", this.handleNextLevelClickBound);
        document.getElementById("restart-victory-btn").removeEventListener("click", this.handleRestartClickBound);
        document.getElementById("resume-btn").removeEventListener("click", this.handleResumeClickBound);
        document.getElementById("restart-pause-btn").removeEventListener("click", this.handleRestartClickBound);
        
        // Limpa o gamepad manager se necessário
        if (this.gamepadManager) {
            this.gamepadManager.destroy();
        }
    }

    // Configura os event listeners
    setupEventListeners() {
        // Liga os manipuladores de eventos a 'this' para que possam ser removidos
        this.handleKeyDownBound = this.handleKeyDown.bind(this);
        
        // Controles jogador 1
        this.handleUpClickBound = this.movePlayer.bind(this, 0, -1, 1);
        this.handleDownClickBound = this.movePlayer.bind(this, 0, 1, 1);
        this.handleLeftClickBound = this.movePlayer.bind(this, -1, 0, 1);
        this.handleRightClickBound = this.movePlayer.bind(this, 1, 0, 1);
        
        // Controles jogador 2
        this.handleUpClickP2Bound = this.movePlayer.bind(this, 0, -1, 2);
        this.handleDownClickP2Bound = this.movePlayer.bind(this, 0, 1, 2);
        this.handleLeftClickP2Bound = this.movePlayer.bind(this, -1, 0, 2);
        this.handleRightClickP2Bound = this.movePlayer.bind(this, 1, 0, 2);
        
        this.handleRestartClickBound = this.restartGame.bind(this);
        this.handlePauseClickBound = this.togglePause.bind(this);
        this.handleResumeClickBound = this.togglePause.bind(this);
        this.handleNextLevelClickBound = this.nextLevel.bind(this);
        this.handleCloseModalBound = this.hideModal.bind(this, this.gameOverModal);
        
        // Recria o gamepad manager se necessário
        if (!this.gamepadManager || !this.gamepadManager.isPolling) {
            this.gamepadManager = new GamepadManager(this);
        }

        // Controles do teclado
        document.addEventListener('keydown', this.handleKeyDownBound);
        
        // Controles móveis jogador 1
        document.getElementById('up-btn').addEventListener('click', this.handleUpClickBound);
        document.getElementById('down-btn').addEventListener('click', this.handleDownClickBound);
        document.getElementById('left-btn').addEventListener('click', this.handleLeftClickBound);
        document.getElementById('right-btn').addEventListener('click', this.handleRightClickBound);
        
        // Controles móveis jogador 2
        if (this.gameMode === 'multiplayer') {
            document.getElementById('up-btn-p2').addEventListener('click', this.handleUpClickP2Bound);
            document.getElementById('down-btn-p2').addEventListener('click', this.handleDownClickP2Bound);
            document.getElementById('left-btn-p2').addEventListener('click', this.handleLeftClickP2Bound);
            document.getElementById('right-btn-p2').addEventListener('click', this.handleRightClickP2Bound);
        }
        
        // Botões de ação
        document.getElementById('restart-btn').addEventListener('click', this.handleRestartClickBound);
        document.getElementById('pause-btn').addEventListener('click', this.handlePauseClickBound);
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.backToMenu());
        
        // Modais
        document.getElementById('play-again-btn').addEventListener('click', this.handleRestartClickBound);
        document.getElementById('close-modal-btn').addEventListener('click', this.handleCloseModalBound);
        document.getElementById('next-level-btn').addEventListener('click', this.handleNextLevelClickBound);
        document.getElementById('restart-victory-btn').addEventListener('click', this.handleRestartClickBound);
        document.getElementById('resume-btn').addEventListener('click', this.handleResumeClickBound);
        document.getElementById('restart-pause-btn').addEventListener('click', this.handleRestartClickBound);
    }

    // Manipulador de evento keydown
    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;
        
        // Controles jogador 1 (WASD e Setas)
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.movePlayer(0, -1, 1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.movePlayer(0, 1, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.movePlayer(-1, 0, 1);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.movePlayer(1, 0, 1);
                break;
            case 'Escape':
                this.togglePause();
                break;
        }
        
        // Controles jogador 2 (IJKL) - apenas em multiplayer
        if (this.gameMode === 'multiplayer') {
            switch (e.key) {
                case 'i':
                case 'I':
                    e.preventDefault();
                    this.movePlayer(0, -1, 2);
                    break;
                case 'k':
                case 'K':
                    e.preventDefault();
                    this.movePlayer(0, 1, 2);
                    break;
                case 'j':
                case 'J':
                    e.preventDefault();
                    this.movePlayer(-1, 0, 2);
                    break;
                case 'l':
                case 'L':
                    e.preventDefault();
                    this.movePlayer(1, 0, 2);
                    break;
            }
        }
    }
    
    // Move o jogador (player: 1 ou 2)
    movePlayer(dx, dy, player = 1) {
        if (this.gameState !== 'playing') return;
        
        // Verifica se o jogador já terminou (em multiplayer)
        if (this.gameMode === 'multiplayer') {
            if (player === 1 && this.player1Finished) return;
            if (player === 2 && this.player2Finished) return;
        }
        
        const currentPos = player === 1 ? this.playerPos : this.player2Pos;
        const newX = currentPos.x + dx;
        const newY = currentPos.y + dy;
        
        // Verifica limites e paredes
        if (newX < 0 || newX >= this.mazeWidth || 
            newY < 0 || newY >= this.mazeHeight || 
            this.maze[newY][newX] === 'wall') {
            return;
        }
        
        // Verifica colisão com outro jogador
        if (this.gameMode === 'multiplayer') {
            const otherPos = player === 1 ? this.player2Pos : this.playerPos;
            if (newX === otherPos.x && newY === otherPos.y) {
                return; // Não permite ocupar mesma célula
            }
        }
        
        // Remove jogador da posição atual
        const playerType = player === 1 ? 'player' : 'player2';
        this.maze[currentPos.y][currentPos.x] = 'path';
        
        // Atualiza posição
        currentPos.x = newX;
        currentPos.y = newY;
        this.moves++;
        
        // Verifica o que está na nova posição
        const cellType = this.maze[newY][newX];
        
        if (cellType === 'target') {
            if (this.gameMode === 'singleplayer') {
                this.victory();
            } else {
                // Em multiplayer, marca jogador como finalizado
                if (player === 1) {
                    this.player1Finished = true;
                } else {
                    this.player2Finished = true;
                }
                
                // Verifica se ambos terminaram
                if (this.player1Finished && this.player2Finished) {
                    this.victory();
                } else {
                    // Coloca jogador no objetivo mas mantém o jogo rodando
                    this.maze[newY][newX] = playerType;
                    this.updateScore(100);
                    this.soundManager.play('move');
                }
            }
        } else if (cellType === 'distraction') {
            this.gameOver('distraction', player);
        } else {
            // Coloca jogador na nova posição
            this.maze[newY][newX] = playerType;
            this.updateScore(10); // Pontos por movimento válido
            this.soundManager.play('move');
        }
        
        this.renderMaze();
        this.updateUI();
    }
    
    // Atualiza a pontuação
    updateScore(points) {
        this.score += points;
        this.updateUI();
    }
    
    // Atualiza a interface do usuário
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.movesElement.textContent = this.moves;
    }
    
    // Inicia o timer
    startTimer() {
        this.startTime = Date.now() - this.elapsedTime;
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.elapsedTime = Date.now() - this.startTime;
                const seconds = Math.floor(this.elapsedTime / 1000);
                const minutes = Math.floor(seconds / 60);
                const displaySeconds = seconds % 60;
                this.timerElement.textContent = 
                    `${String(minutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;
            }
        }, 100);
    }
    
    // Para o timer
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // Vitória
    victory() {
        this.gameState = 'victory';
        this.stopTimer();
        
        // Efeitos sonoros e visuais
        this.soundManager.play('victory');
        
        // Cria explosão de partículas na posição do jogador
        const playerCell = document.querySelector(`[data-x="${this.playerPos.x}"][data-y="${this.playerPos.y}"]`);
        if (playerCell) {
            const rect = playerCell.getBoundingClientRect();
            this.particleSystem.createExplosion(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                'victory',
                30
            );
        }
        
        // Verifica conquistas
        this.achievementSystem.checkAchievement("firstVictory");
        if (this.moves < 50) {
            this.achievementSystem.checkAchievement("speedRunner");
        }
        
        // Atualiza modal
        let victoryMessage = 'Você conseguiu levar o eletricista ao psicólogo!';
        if (this.gameMode === 'multiplayer') {
            victoryMessage = 'Vocês conseguiram levar os dois eletricistas ao psicólogo!';
        }
        document.getElementById('victory-message').textContent = victoryMessage;
        document.getElementById('victory-score').textContent = this.score;
        document.getElementById('victory-time').textContent = this.timerElement.textContent;
        document.getElementById('victory-moves').textContent = this.moves;
        
        // Adiciona classe de vitória
        document.body.classList.add('victory');
        
        setTimeout(() => {
            this.showModal(this.victoryModal);
        }, 500);
    }
    
    // Game Over
    gameOver(reason = 'unknown', player = 1) {
        this.gameState = 'gameOver';
        this.stopTimer();
        
        // Efeitos sonoros e visuais
        this.soundManager.play('gameOver');
        
        // Cria explosão de partículas na posição do jogador
        const currentPos = player === 1 ? this.playerPos : this.player2Pos;
        const playerCell = document.querySelector(`[data-x="${currentPos.x}"][data-y="${currentPos.y}"]`);
        if (playerCell) {
            const rect = playerCell.getBoundingClientRect();
            this.particleSystem.createExplosion(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                'gameOver',
                20
            );
        }
        
        let message = 'Tente novamente!';
        if (reason === 'distraction') {
            if (this.gameMode === 'multiplayer') {
                message = `Jogador ${player} foi distraído! Foquem no objetivo.`;
            } else {
                message = 'Você foi distraído! Foque no objetivo.';
            }
            this.soundManager.play('distraction');
        }
        
        // Atualiza modal
        document.getElementById('modal-message').textContent = message;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-time').textContent = this.timerElement.textContent;
        document.getElementById('final-moves').textContent = this.moves;
        
        // Adiciona classe de game over
        document.body.classList.add('game-over');
        
        setTimeout(() => {
            this.showModal(this.gameOverModal);
        }, 500);
    }
    
    // Próximo nível
    nextLevel() {
        this.currentLevel++;
        this.hideModal(this.victoryModal);
        this.restartGame();
    }
    
    // Reinicia o jogo
    restartGame() {
        // Remove event listeners antigos para evitar duplicação
        this.removeEventListeners();

        this.gameState = 'playing';
        this.score = 0;
        this.moves = 0;
        this.elapsedTime = 0;
        this.player1Finished = false;
        this.player2Finished = false;
        
        // Verifica conquista de persistência
        this.achievementSystem.checkAchievement("gameStart");
        
        // Remove classes de estado
        document.body.classList.remove("game-over", "victory", "game-paused");
        
        // Esconde modais
        this.hideModal(this.gameOverModal);
        this.hideModal(this.victoryModal);
        this.hideModal(this.pauseModal);
        
        // Para timer anterior e remove event listeners antigos
        this.stopTimer();

        // Reconfigura os event listeners para os novos elementos (se houver) ou para garantir que estejam ativos
        this.setupEventListeners();
        
        // Regenera o labirinto
        this.generateMaze();
        this.renderMaze();
        this.startTimer();
        this.updateUI();
    }
    
    // Volta ao menu
    backToMenu() {
        this.removeEventListeners();
        this.stopTimer();
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('desktop-instructions').style.display = 'none';
        document.getElementById('mode-selection').style.display = 'flex';
    }
    
    // Pausa/despausa o jogo
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.body.classList.add('game-paused');
            this.showModal(this.pauseModal);
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.body.classList.remove('game-paused');
            this.hideModal(this.pauseModal);
        }
    }
    
    // Mostra modal
    showModal(modal) {
        modal.classList.remove('hidden');
    }
    
    // Esconde modal
    hideModal(modal) {
        modal.classList.add('hidden');
    }
}

// Função para iniciar o jogo com o modo selecionado
function startGame(mode) {
    gameMode = mode;
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('game-container').style.display = 'grid';
    document.getElementById('desktop-instructions').style.display = 'block';
    window.game = new MazeGame(mode);
}

// Inicializa a tela de seleção quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Configura botões de seleção de modo
    document.getElementById('singleplayer-btn').addEventListener('click', () => {
        startGame('singleplayer');
    });
    
    document.getElementById('multiplayer-btn').addEventListener('click', () => {
        startGame('multiplayer');
    });
});

// Previne zoom em dispositivos móveis
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Adiciona suporte a gestos de swipe em dispositivos móveis
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    const minSwipeDistance = 50;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Swipe horizontal
        if (Math.abs(diffX) > minSwipeDistance) {
            if (diffX > 0) {
                // Swipe left
                if (document.getElementById('left-btn')) {
                    document.getElementById('left-btn').click();
                }
            } else {
                // Swipe right
                if (document.getElementById('right-btn')) {
                    document.getElementById('right-btn').click();
                }
            }
        }
    } else {
        // Swipe vertical
        if (Math.abs(diffY) > minSwipeDistance) {
            if (diffY > 0) {
                // Swipe up
                if (document.getElementById('up-btn')) {
                    document.getElementById('up-btn').click();
                }
            } else {
                // Swipe down
                if (document.getElementById('down-btn')) {
                    document.getElementById('down-btn').click();
                }
            }
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
});
