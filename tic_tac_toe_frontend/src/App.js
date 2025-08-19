import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Utility: Winning line index triplets representing board cells
 * The board is represented as a flat array of length 9:
 * indexes:
 * 0 1 2
 * 3 4 5
 * 6 7 8
 */
const WIN_LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
];

/**
 * Returns winner symbol 'X' | 'O' or null.
 * Also returns winning line indices if present.
 */
function calculateWinner(squares) {
  for (const [a, b, c] of WIN_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Theme handling: default to light per requirements, but keep toggle for accessibility/testing.
   * We store theme in state and reflect it to document root via data-theme for CSS variables.
   */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  /**
   * Game state:
   * - squares: 9-element array of 'X' | 'O' | null
   * - xIsNext: boolean to track turns
   * - status: derived text about game state
   * - winnerInfo: memoized winner and line
   */
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const winnerInfo = useMemo(() => calculateWinner(squares), [squares]);
  const isBoardFull = useMemo(() => squares.every((s) => s !== null), [squares]);
  const isDraw = !winnerInfo.winner && isBoardFull;

  const currentPlayer = xIsNext ? 'X' : 'O';

  const statusText = winnerInfo.winner
    ? `Winner: ${winnerInfo.winner}`
    : isDraw
    ? 'Draw'
    : `Turn: ${currentPlayer}`;

  /**
   * Handle user clicking a cell.
   * - Ignore if game is finished or cell already filled
   * - Otherwise fill with current player's symbol and toggle turn
   */
  const handleCellClick = (index) => {
    if (winnerInfo.winner || squares[index]) return;
    setSquares((prev) => {
      const next = [...prev];
      next[index] = currentPlayer;
      return next;
    });
    setXIsNext((prev) => !prev);
  };

  // PUBLIC_INTERFACE
  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="App ttt-app">
      <header className="ttt-header">
        <div className="ttt-title">
          <h1 className="ttt-heading">Tic Tac Toe</h1>
          <p className="ttt-subtitle">Modern, minimalistic, responsive</p>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      <main className="ttt-main">
        <section className="ttt-board-wrapper" aria-label="Tic Tac Toe game board">
          <div className="ttt-board" role="grid" aria-label="3 by 3 grid">
            {squares.map((value, idx) => {
              const isWinningCell =
                winnerInfo.line && winnerInfo.line.includes(idx);
              return (
                <button
                  key={idx}
                  className={`ttt-cell ${isWinningCell ? 'win' : ''}`}
                  role="gridcell"
                  aria-label={`Cell ${idx + 1} ${value ? `with ${value}` : 'empty'}`}
                  onClick={() => handleCellClick(idx)}
                  disabled={Boolean(winnerInfo.winner) || Boolean(value)}
                >
                  <span className={`ttt-mark ${value ? 'visible' : ''}`}>
                    {value}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ttt-controls" aria-live="polite">
          <div className="ttt-status" data-status={winnerInfo.winner ? 'win' : isDraw ? 'draw' : 'turn'}>
            {statusText}
          </div>

          <div className="ttt-actions">
            <button className="btn btn-primary" onClick={resetGame} aria-label="Reset game">
              Reset
            </button>
          </div>

          <div className="ttt-legend">
            <div className="legend-item">
              <span className="legend-swatch legend-x">X</span>
              <span className="legend-text">Player X</span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-o">O</span>
              <span className="legend-text">Player O</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="ttt-footer">
        <small>Built with React • Light theme • Responsive</small>
      </footer>
    </div>
  );
}

export default App;
