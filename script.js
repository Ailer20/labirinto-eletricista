// Classe principal do jogo
class MazeGame {
    constructor() {
        this.maze = [];
        this.playerPos = { x: 0, y: 0 };
        this.targetPos = { x: 0, y: 0 };
        this.distractions = [];
        this.gameState = 'playing'; // 'playing', 'paused', 'gameOver', 'victory'
        this.score = 0;
        this.moves = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.currentLevel = 1;
        
        // Sistemas adicionais
        this.soundManager = new SoundManager();
        this.particleSystem = new ParticleSystem();
        this.achievementSystem = new AchievementSystem();
        
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
    }
    
    // Gera um labirinto estático baseado na imagem de referência
    generateMaze() {
        // Define as dimensões fixas do labirinto (16x12 baseado na imagem)
        this.mazeWidth = 16;
        this.mazeHeight = 12;
        
        // Cria o labirinto estático exatamente como na imagem
        this.createStaticMaze();
        
        // Define posição inicial do jogador (segunda linha, segunda coluna)
        this.playerPos = { x: 1, y: 1 };
        this.maze[1][1] = 'player';
        
        // Define posição do objetivo (psicólogo) - linha 10, coluna 14 (baseado na imagem)
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
        document.getElementById("up-btn").removeEventListener("click", this.handleUpClickBound);
        document.getElementById("down-btn").removeEventListener("click", this.handleDownClickBound);
        document.getElementById("left-btn").removeEventListener("click", this.handleLeftClickBound);
        document.getElementById("right-btn").removeEventListener("click", this.handleRightClickBound);
        document.getElementById("restart-btn").removeEventListener("click", this.handleRestartClickBound);
        document.getElementById("pause-btn").removeEventListener("click", this.handlePauseClickBound);
        document.getElementById("resume-btn").removeEventListener("click", this.handleResumeClickBound);
        document.getElementById("next-level-btn").removeEventListener("click", this.handleNextLevelClickBound);
        document.getElementById("restart-gameover-btn").removeEventListener("click", this.handleRestartClickBound);
        document.getElementById("restart-victory-btn").removeEventListener("click", this.handleRestartClickBound);
    }

    // Configura os event listeners
    setupEventListeners() {
        // Liga os manipuladores de eventos a 'this' para que possam ser removidos
        this.handleKeyDownBound = this.handleKeyDown.bind(this);
        this.handleUpClickBound = this.movePlayer.bind(this, 0, -1);
        this.handleDownClickBound = this.movePlayer.bind(this, 0, 1);
        this.handleLeftClickBound = this.movePlayer.bind(this, -1, 0);
        this.handleRightClickBound = this.movePlayer.bind(this, 1, 0);
        this.handleRestartClickBound = this.restartGame.bind(this);
        this.handlePauseClickBound = this.togglePause.bind(this);
        this.handleResumeClickBound = this.togglePause.bind(this);
        this.handleNextLevelClickBound = this.nextLevel.bind(this);
        this.handleCloseModalBound = this.hideModal.bind(this, this.gameOverModal);

        // Controles do teclado
        document.addEventListener('keydown', this.handleKeyDownBound);
        
        // Controles móveis
        document.getElementById('up-btn').addEventListener('click', this.handleUpClickBound);
        document.getElementById('down-btn').addEventListener('click', this.handleDownClickBound);
        document.getElementById('left-btn').addEventListener('click', this.handleLeftClickBound);
        document.getElementById('right-btn').addEventListener('click', this.handleRightClickBound);
        
        // Botões de ação
        document.getElementById('restart-btn').addEventListener('click', this.handleRestartClickBound);
        document.getElementById('pause-btn').addEventListener('click', this.handlePauseClickBound);
        
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
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.movePlayer(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.movePlayer(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.movePlayer(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.movePlayer(1, 0);
                break;
            case 'Escape':
                this.togglePause();
                break;
        }
    }
    
    // Move o jogador
    movePlayer(dx, dy) {
        if (this.gameState !== 'playing') return;
        
        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;
        
        // Verifica limites e paredes
        if (newX < 0 || newX >= this.mazeWidth || 
            newY < 0 || newY >= this.mazeHeight || 
            this.maze[newY][newX] === 'wall') {
            return;
        }
        
        // Remove jogador da posição atual
        this.maze[this.playerPos.y][this.playerPos.x] = 'path';
        
        // Atualiza posição
        this.playerPos.x = newX;
        this.playerPos.y = newY;
        this.moves++;
        
        // Verifica o que está na nova posição
        const cellType = this.maze[newY][newX];
        
        if (cellType === 'target') {
            this.victory();
        } else if (cellType === 'distraction') {
            this.gameOver('distraction');
        } else {
            // Coloca jogador na nova posição
            this.maze[newY][newX] = 'player';
            this.updateScore(10); // Pontos por movimento válido
            this.soundManager.play('move');
        }
        
        this.renderMaze();
        this.updateUI();
    }
    
    // Atualiza a pontuação
    updateScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
    }
    
    // Atualiza a interface
    updateUI() {
        this.movesElement.textContent = this.moves;
        this.scoreElement.textContent = this.score;
    }
    
    // Inicia o cronômetro
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.elapsedTime = Date.now() - this.startTime;
                this.updateTimer();
            }
        }, 100);
    }
    
    // Atualiza o cronômetro
    updateTimer() {
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Para o cronômetro
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
        
        // Cria explosão de partículas na posição do objetivo
        const targetCell = document.querySelector(`[data-x="${this.targetPos.x}"][data-y="${this.targetPos.y}"]`);
        if (targetCell) {
            const rect = targetCell.getBoundingClientRect();
            this.particleSystem.createExplosion(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                'victory',
                30
            );
        }
        
        // Bônus de tempo
        const timeBonus = Math.max(0, 300 - Math.floor(this.elapsedTime / 1000)) * 10;
        const moveBonus = Math.max(0, 100 - this.moves) * 5;
        this.updateScore(timeBonus + moveBonus + 1000);
        
        // Verifica conquistas
        this.achievementSystem.checkAchievement('victory');
        this.achievementSystem.checkAchievement('time', this.elapsedTime);
        this.achievementSystem.checkAchievement('moves', this.moves);
        this.achievementSystem.checkAchievement('level', this.currentLevel);
        
        // Atualiza estatísticas do modal
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
    gameOver(reason) {
        this.gameState = 'gameOver';
        this.stopTimer();
        
        // Efeitos sonoros e visuais
        this.soundManager.play('gameOver');
        
        // Cria explosão de partículas na posição do jogador
        const playerCell = document.querySelector(`[data-x="${this.playerPos.x}"][data-y="${this.playerPos.y}"]`);
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
            message = 'Você foi distraído! Foque no objetivo.';
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
        this.gameState = 'playing';
        this.score = 0;
        this.moves = 0;
        this.elapsedTime = 0;
        
        // Verifica conquista de persistência
        this.achievementSystem.checkAchievement('gameStart');
        
        // Remove classes de estado
        document.body.classList.remove('game-over', 'victory', 'game-paused');
        
        // Esconde modais
        this.hideModal(this.gameOverModal);
        this.hideModal(this.victoryModal);
        this.hideModal(this.pauseModal);
        
        // Para timer anterior e remove event listeners antigos
        this.stopTimer();
        this.removeEventListeners();
        
        // Regenera o labirinto
        this.generateMaze();
        this.renderMaze();
        this.startTimer();
        this.updateUI();
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

// Inicializa o jogo quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    new MazeGame();
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
                document.getElementById('left-btn').click();
            } else {
                // Swipe right
                document.getElementById('right-btn').click();
            }
        }
    } else {
        // Swipe vertical
        if (Math.abs(diffY) > minSwipeDistance) {
            if (diffY > 0) {
                // Swipe up
                document.getElementById('up-btn').click();
            } else {
                // Swipe down
                document.getElementById('down-btn').click();
            }
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
});
