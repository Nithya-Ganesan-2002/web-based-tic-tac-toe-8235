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

/**
 * Compute empty cell indices from board.
 */
function getAvailableMoves(squares) {
  const moves = [];
  for (let i = 0; i < squares.length; i += 1) {
    if (!squares[i]) moves.push(i);
  }
  return moves;
}

/**
 * Minimax algorithm for Tic Tac Toe.
 * Returns the best move index for the given player ('X' or 'O').
 * We treat 'X' as maximizing player, 'O' as minimizing player for stable results.
 */
function minimax(squares, player) {
  const { winner } = calculateWinner(squares);
  const isBoardFull = squares.every((s) => s !== null);

  if (winner === 'X') return { score: 1 };
  if (winner === 'O') return { score: -1 };
  if (isBoardFull) return { score: 0 };

  const maximizing = player === 'X';
  let bestMove = null;

  if (maximizing) {
    let bestScore = -Infinity;
    for (const move of getAvailableMoves(squares)) {
      const next = [...squares];
      next[move] = 'X';
      const result = minimax(next, 'O');
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    }
    return { score: bestScore, move: bestMove };
  } else {
    let bestScore = Infinity;
    for (const move of getAvailableMoves(squares)) {
      const next = [...squares];
      next[move] = 'O';
      const result = minimax(next, 'X');
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
    }
    return { score: bestScore, move: bestMove };
  }
}

/**
 * Get AI move index for given board and aiSymbol ('X'|'O').
 * We run minimax from perspective of 'X' as maximizing, 'O' as minimizing.
 * If aiSymbol is 'O', we request the move from minimizing player branch, and vice versa.
 */
function getBestAIMove(squares, aiSymbol) {
  // If board is empty, prefer center for speed and quality
  if (squares.every((s) => s === null)) return 4;
  const result = minimax(squares, 'X'); // compute base tree once
  if (aiSymbol === 'X') {
    // result.move is best for X (maximizing)
    return result.move ?? getAvailableMoves(squares)[0];
  }
  // For O, compute from minimizing perspective
  const resO = minimax(squares, 'O');
  return resO.move ?? getAvailableMoves(squares)[0];
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
   * - mode: 'human' | 'ai' (human = 2 players; ai = vs computer)
   * - aiPlays: 'X' | 'O' when in ai mode (defaults to 'O')
   */
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('ai'); // default to AI mode for demo
  const [aiPlays, setAiPlays] = useState('O'); // AI plays as O by default

  const winnerInfo = useMemo(() => calculateWinner(squares), [squares]);
  const isBoardFull = useMemo(() => squares.every((s) => s !== null), [squares]);
  const isDraw = !winnerInfo.winner && isBoardFull;

  const currentPlayer = xIsNext ? 'X' : 'O';
  const humanTurn = mode === 'human' || currentPlayer !== aiPlays;

  const statusText = winnerInfo.winner
    ? `Winner: ${winnerInfo.winner}`
    : isDraw
    ? 'Draw'
    : mode === 'ai'
    ? `Turn: ${currentPlayer} ${humanTurn ? '(You)' : '(AI)'}`
    : `Turn: ${currentPlayer}`;

  /**
   * Handle user clicking a cell.
   * - Ignore if game is finished or cell already filled
   * - In AI mode, ignore clicks when it's AI's turn
   * - Otherwise fill with current player's symbol and toggle turn
   */
  const handleCellClick = (index) => {
    if (winnerInfo.winner || squares[index]) return;
    if (mode === 'ai' && !humanTurn) return;

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

  /**
   * Automatically let the AI play when:
   * - mode is 'ai'
   * - no winner
   * - board not full
   * - it's AI's turn
   */
  useEffect(() => {
    if (mode !== 'ai') return;
    if (winnerInfo.winner || isDraw) return;
    if (humanTurn) return;

    // small timeout to feel natural and allow UI to update
    const t = setTimeout(() => {
      setSquares((prev) => {
        const move = getBestAIMove(prev, aiPlays);
        if (move === undefined || move === null || prev[move]) return prev;
        const next = [...prev];
        next[move] = aiPlays;
        return next;
      });
      setXIsNext((prev) => !prev);
    }, 250);

    return () => clearTimeout(t);
  }, [mode, winnerInfo.winner, isDraw, humanTurn, aiPlays, xIsNext, squares]);

  /**
   * Mode switching handlers: changing mode resets the game for clarity.
   */
  const handleModeChange = (e) => {
    const nextMode = e.target.value;
    setMode(nextMode);
    resetGame();
  };

  const handleAiSideChange = (e) => {
    const side = e.target.value; // 'X' or 'O'
    setAiPlays(side);
    resetGame();
  };

  // If AI is set to play first as 'X', trigger immediately on fresh board.
  useEffect(() => {
    if (mode !== 'ai') return;
    const noMovesPlayed = squares.every((s) => s === null);
    if (noMovesPlayed && aiPlays === 'X') {
      const t = setTimeout(() => {
        setSquares((prev) => {
          const move = getBestAIMove(prev, 'X');
          const next = [...prev];
          next[move] = 'X';
          return next;
        });
        setXIsNext(false); // O next
      }, 150);
      return () => clearTimeout(t);
    }
  }, [mode, aiPlays, squares]);

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
                  disabled={
                    Boolean(winnerInfo.winner) ||
                    Boolean(value) ||
                    (mode === 'ai' && !humanTurn)
                  }
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

          <div className="ttt-actions" role="group" aria-label="Mode selection">
            <label htmlFor="mode-select" style={{ fontWeight: 600 }}>Mode:</label>
            <select
              id="mode-select"
              value={mode}
              onChange={handleModeChange}
              aria-label="Select game mode"
              className="btn"
            >
              <option value="human">Human vs Human</option>
              <option value="ai">Human vs AI</option>
            </select>

            {mode === 'ai' && (
              <>
                <label htmlFor="ai-side-select" style={{ fontWeight: 600 }}>AI Plays:</label>
                <select
                  id="ai-side-select"
                  value={aiPlays}
                  onChange={handleAiSideChange}
                  aria-label="Select AI side"
                  className="btn"
                >
                  <option value="X">X (first)</option>
                  <option value="O">O (second)</option>
                </select>
              </>
            )}
          </div>

          <div className="ttt-legend">
            <div className="legend-item">
              <span className="legend-swatch legend-x">X</span>
              <span className="legend-text">
                {mode === 'ai' && aiPlays === 'X' ? 'AI' : 'Player X'}
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-o">O</span>
              <span className="legend-text">
                {mode === 'ai' && aiPlays === 'O' ? 'AI' : 'Player O'}
              </span>
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
