import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useSendCode: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
  }),
  useDevLogin: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  it('renders login form with all elements', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number or email/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
  });

  it('updates method to email when email is entered', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    const input = screen.getByLabelText(/phone number or email/i);
    await user.type(input, 'test@example.com');
    
    const emailRadio = screen.getByRole('radio', { name: /email/i }) as HTMLInputElement;
    expect(emailRadio.checked).toBe(true);
  });

  it('keeps method as whatsapp when phone is entered', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    const input = screen.getByLabelText(/phone number or email/i);
    await user.type(input, '0821234567');
    
    const whatsappRadio = screen.getByLabelText(/whatsapp/i) as HTMLInputElement;
    expect(whatsappRadio.checked).toBe(true);
  });

  it('disables submit button when contact is empty', () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /send verification code/i });
    expect(submitButton).toBeDisabled();
  });
});
