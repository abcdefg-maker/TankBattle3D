// ui.js - UI管理系统
class UIManager {
    constructor() {
        this.startScreen = document.getElementById('start-screen');
        this.gameHud = document.getElementById('game-hud');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.levelScreen = document.getElementById('level-screen');

        this.scoreValue = document.getElementById('score-value');
        this.enemiesValue = document.getElementById('enemies-value');
        this.levelValue = document.getElementById('level-value');
        this.livesDisplay = document.getElementById('lives-display');
        this.powerupIndicator = document.getElementById('powerup-indicator');
        this.powerupText = document.getElementById('powerup-text');

        this.gameoverTitle = document.getElementById('gameover-title');
        this.gameoverScore = document.getElementById('gameover-score');
        this.gameoverKills = document.getElementById('gameover-kills');
        this.levelTitle = document.getElementById('level-title');
        this.levelDesc = document.getElementById('level-desc');
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.gameHud.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.levelScreen.classList.add('hidden');
    }

    showGameHud() {
        this.startScreen.classList.add('hidden');
        this.gameHud.classList.remove('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.levelScreen.classList.add('hidden');
    }

    showPauseScreen() {
        this.pauseScreen.classList.remove('hidden');
    }

    hidePauseScreen() {
        this.pauseScreen.classList.add('hidden');
    }

    showGameOver(won, score, kills) {
        this.gameoverScreen.classList.remove('hidden');
        this.gameHud.classList.add('hidden');
        this.gameoverTitle.textContent = won ? '胜利！' : '游戏结束';
        this.gameoverTitle.style.color = won ? '#ffd700' : '#ff3333';
        this.gameoverScore.textContent = '最终分数: ' + score;
        this.gameoverKills.textContent = '击杀数: ' + kills;
    }

    showLevelScreen(name, desc) {
        this.levelScreen.classList.remove('hidden');
        this.levelTitle.textContent = name;
        this.levelDesc.textContent = desc;
    }

    hideLevelScreen() {
        this.levelScreen.classList.add('hidden');
    }

    updateScore(score) {
        this.scoreValue.textContent = score;
    }

    updateEnemies(count) {
        this.enemiesValue.textContent = count;
    }

    updateLevel(level) {
        this.levelValue.textContent = level;
    }

    updateLives(lives) {
        const hearts = this.livesDisplay.querySelectorAll('.heart');
        hearts.forEach((h, i) => {
            if (i < lives) {
                h.classList.remove('lost');
            } else {
                h.classList.add('lost');
            }
        });
    }

    showPowerupText(text, color) {
        this.powerupIndicator.classList.remove('hidden');
        this.powerupText.textContent = text;
        this.powerupText.style.color = color || '#fff';
    }

    hidePowerupText() {
        this.powerupIndicator.classList.add('hidden');
    }
}

window.UIManager = UIManager;
