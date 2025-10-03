// Sistema de efeitos sonoros usando Web Audio API
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.3;
        
        this.initAudioContext();
        this.createSounds();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API não suportada');
            this.enabled = false;
        }
    }
    
    // Cria sons proceduralmente
    createSounds() {
        if (!this.enabled) return;
        
        // Som de movimento
        this.sounds.move = this.createTone(220, 0.1, 'sine');
        
        // Som de game over
        this.sounds.gameOver = this.createSequence([
            { freq: 330, duration: 0.2, type: 'sawtooth' },
            { freq: 220, duration: 0.2, type: 'sawtooth' },
            { freq: 165, duration: 0.4, type: 'sawtooth' }
        ]);
        
        // Som de vitória
        this.sounds.victory = this.createSequence([
            { freq: 262, duration: 0.2, type: 'sine' },
            { freq: 330, duration: 0.2, type: 'sine' },
            { freq: 392, duration: 0.2, type: 'sine' },
            { freq: 523, duration: 0.4, type: 'sine' }
        ]);
        
        // Som de distração
        this.sounds.distraction = this.createTone(150, 0.3, 'sawtooth');
        
        // Som de coleta/objetivo
        this.sounds.collect = this.createTone(440, 0.2, 'sine');
    }
    
    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    createSequence(notes) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            let currentTime = this.audioContext.currentTime;
            
            notes.forEach(note => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                oscillator.type = note.type || 'sine';
                
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(this.volume, currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);
                
                currentTime += note.duration;
            });
        };
    }
    
    play(soundName) {
        if (this.sounds[soundName] && this.enabled) {
            // Resume audio context se necessário (política do navegador)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.sounds[soundName]();
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

// Sistema de partículas para efeitos visuais
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        
        this.createCanvas();
        this.startAnimation();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '999';
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticle(x, y, type = 'victory') {
        const colors = {
            victory: ['#48bb78', '#38a169', '#68d391', '#9ae6b4'],
            gameOver: ['#e53e3e', '#c53030', '#fc8181', '#feb2b2'],
            move: ['#667eea', '#764ba2', '#9f7aea', '#b794f6']
        };
        
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 1.0,
            decay: 0.02,
            size: Math.random() * 6 + 2,
            color: colors[type][Math.floor(Math.random() * colors[type].length)],
            type: type
        };
        
        this.particles.push(particle);
    }
    
    createExplosion(x, y, type = 'victory', count = 20) {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, type);
        }
    }
    
    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Atualiza posição
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravidade
            
            // Atualiza vida
            particle.life -= particle.decay;
            
            // Remove partículas mortas
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Desenha partícula
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    startAnimation() {
        const animate = () => {
            this.update();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Sistema de conquistas
class AchievementSystem {
    constructor() {
        this.achievements = {
            firstWin: { name: 'Primeira Vitória', description: 'Complete seu primeiro labirinto', unlocked: false },
            speedRunner: { name: 'Corredor Veloz', description: 'Complete um labirinto em menos de 30 segundos', unlocked: false },
            efficient: { name: 'Eficiente', description: 'Complete um labirinto com menos de 50 movimentos', unlocked: false },
            persistent: { name: 'Persistente', description: 'Jogue 10 partidas', unlocked: false },
            levelMaster: { name: 'Mestre dos Níveis', description: 'Alcance o nível 5', unlocked: false }
        };
        
        this.stats = {
            gamesPlayed: 0,
            victories: 0,
            bestTime: Infinity,
            bestMoves: Infinity,
            currentLevel: 1
        };
        
        this.loadProgress();
    }
    
    checkAchievement(type, value) {
        let newAchievement = null;
        
        switch (type) {
            case 'victory':
                this.stats.victories++;
                if (!this.achievements.firstWin.unlocked && this.stats.victories >= 1) {
                    this.achievements.firstWin.unlocked = true;
                    newAchievement = this.achievements.firstWin;
                }
                break;
                
            case 'time':
                if (value < this.stats.bestTime) {
                    this.stats.bestTime = value;
                    if (!this.achievements.speedRunner.unlocked && value < 30000) {
                        this.achievements.speedRunner.unlocked = true;
                        newAchievement = this.achievements.speedRunner;
                    }
                }
                break;
                
            case 'moves':
                if (value < this.stats.bestMoves) {
                    this.stats.bestMoves = value;
                    if (!this.achievements.efficient.unlocked && value < 50) {
                        this.achievements.efficient.unlocked = true;
                        newAchievement = this.achievements.efficient;
                    }
                }
                break;
                
            case 'gameStart':
                this.stats.gamesPlayed++;
                if (!this.achievements.persistent.unlocked && this.stats.gamesPlayed >= 10) {
                    this.achievements.persistent.unlocked = true;
                    newAchievement = this.achievements.persistent;
                }
                break;
                
            case 'level':
                this.stats.currentLevel = Math.max(this.stats.currentLevel, value);
                if (!this.achievements.levelMaster.unlocked && value >= 5) {
                    this.achievements.levelMaster.unlocked = true;
                    newAchievement = this.achievements.levelMaster;
                }
                break;
        }
        
        this.saveProgress();
        
        if (newAchievement) {
            this.showAchievement(newAchievement);
        }
    }
    
    showAchievement(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-text">
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animação de entrada
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove após 4 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    saveProgress() {
        localStorage.setItem('mazeGame_achievements', JSON.stringify(this.achievements));
        localStorage.setItem('mazeGame_stats', JSON.stringify(this.stats));
    }
    
    loadProgress() {
        try {
            const savedAchievements = localStorage.getItem('mazeGame_achievements');
            const savedStats = localStorage.getItem('mazeGame_stats');
            
            if (savedAchievements) {
                this.achievements = { ...this.achievements, ...JSON.parse(savedAchievements) };
            }
            
            if (savedStats) {
                this.stats = { ...this.stats, ...JSON.parse(savedStats) };
            }
        } catch (e) {
            console.warn('Erro ao carregar progresso:', e);
        }
    }
    
    reset() {
        localStorage.removeItem('mazeGame_achievements');
        localStorage.removeItem('mazeGame_stats');
        
        // Reset achievements
        Object.keys(this.achievements).forEach(key => {
            this.achievements[key].unlocked = false;
        });
        
        // Reset stats
        this.stats = {
            gamesPlayed: 0,
            victories: 0,
            bestTime: Infinity,
            bestMoves: Infinity,
            currentLevel: 1
        };
    }
}

// Adiciona estilos CSS para as conquistas
const achievementStyles = `
.achievement-notification {
    position: fixed;
    top: 20px;
    right: -400px;
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 15px;
    z-index: 10000;
    transition: right 0.3s ease;
    max-width: 350px;
}

.achievement-notification.show {
    right: 20px;
}

.achievement-icon {
    font-size: 24px;
    animation: bounce 0.6s ease;
}

.achievement-title {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 4px;
}

.achievement-desc {
    font-size: 12px;
    opacity: 0.9;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
}

@media (max-width: 480px) {
    .achievement-notification {
        right: -350px;
        max-width: 300px;
        padding: 12px 16px;
    }
    
    .achievement-notification.show {
        right: 10px;
    }
}
`;

// Adiciona os estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = achievementStyles;
document.head.appendChild(styleSheet);
