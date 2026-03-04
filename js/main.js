// main.js - 游戏入口
(function() {
    'use strict';

    // 等待DOM加载完成
    window.addEventListener('DOMContentLoaded', () => {
        const game = new Game();
        game.init();
        window.game = game; // 暴露给全局便于调试
    });
})();
