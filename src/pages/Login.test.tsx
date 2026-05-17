import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './Login';

const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  }),
}));

vi.mock('@/assets/logo/orbit_black.png', () => ({ default: 'logo.png' }));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockClearError.mockReset();
  });

  it('renders email + password fields and the sign-in button', () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('toggles password visibility when the eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();

    const password = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(password.type).toBe('password');

    const toggle = password.parentElement?.querySelector('button[type="button"]');
    expect(toggle).toBeTruthy();
    await user.click(toggle!);

    expect(password.type).toBe('text');
  });
});
