import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Tic Tac Toe heading', () => {
  render(<App />);
  const heading = screen.getByText(/Tic Tac Toe/i);
  expect(heading).toBeInTheDocument();
});

test('renders reset button', () => {
  render(<App />);
  const btn = screen.getByRole('button', { name: /reset/i });
  expect(btn).toBeInTheDocument();
});
