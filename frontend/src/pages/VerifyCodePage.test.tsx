import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import VerifyCodePage from './VerifyCodePage';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useVerifyCode: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
  }),
}));

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: {
        contact: 'test@example.com',
        method: 'email',
      },
    }),
  };
});

describe('VerifyCodePage', () => {
  it('renders verification form with contact info', () => {
    render(<VerifyCodePage />);
    
    expect(screen.getByText('Verify Code')).toBeInTheDocument();
    expect(screen.getByText(/we sent a 6-digit code to test@example.com via email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });

  it('only allows numeric input up to 6 digits', async () => {
    const user = userEvent.setup();
    render(<VerifyCodePage />);
    
    const input = screen.getByLabelText(/verification code/i) as HTMLInputElement;
    await user.type(input, 'abc123456789');
    
    expect(input.value).toBe('123456');
  });

  it('disables submit button when code is less than 6 digits', async () => {
    const user = userEvent.setup();
    render(<VerifyCodePage />);
    
    const input = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: /verify & sign in/i });
    
    await user.type(input, '12345');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when code is 6 digits', async () => {
    const user = userEvent.setup();
    render(<VerifyCodePage />);
    
    const input = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: /verify & sign in/i });
    
    await user.type(input, '123456');
    expect(submitButton).not.toBeDisabled();
  });
});
