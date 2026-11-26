import './style.css';
import './ui/gameplay.css';
import { Game } from './core/game.js';
import { showStartupError } from './ui/screens.js';

try {
  const game = new Game();
  window.__game = game;
  game.start();
  if (import.meta.hot) import.meta.hot.dispose(() => game.dispose());
} catch (error) {
  console.error('游戏启动失败', error);
  showStartupError();
}
