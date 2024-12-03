import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest'; 
import { describe, it, expect, afterEach, vi } from 'vitest';
import Cost from '../../src/components/Cost';
import * as api from '../../src/api';

vi.mock('../../src/api', () => ({
  getPackageCost: vi.fn(),
}));

describe('Cost Component Suite', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the Cost component', () => {
    render(<Cost />);

    expect(screen.getByLabelText(/get package cost by id/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter package id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get package cost/i })).toBeInTheDocument();
  });

  it('allows user to input package ID', () => {
    render(<Cost />);

    const packageIdInput = screen.getByPlaceholderText(/enter package id/i);
    fireEvent.change(packageIdInput, { target: { value: 'TestPackageId' } });

    expect(packageIdInput).toHaveValue('TestPackageId');
  });

  it('shows error message if package ID is empty when clicking Get Package Cost button', () => {
    render(<Cost />);

    const button = screen.getByRole('button', { name: /get package cost/i });
    fireEvent.click(button);

    expect(screen.getByText(/please enter a package id/i)).toBeInTheDocument();
  });

  it('calls getPackageCost API and displays the cost on success', async () => {
    (api.getPackageCost as vi.Mock).mockResolvedValueOnce({ cost: 100 });

    render(<Cost />);

    const packageIdInput = screen.getByPlaceholderText(/enter package id/i);
    const button = screen.getByRole('button', { name: /get package cost/i });

    fireEvent.change(packageIdInput, { target: { value: 'TestPackageId' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(api.getPackageCost).toHaveBeenCalledWith('TestPackageId');
      expect(screen.getByText(/package cost retrieved successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/package cost: \$100/i)).toBeInTheDocument();
    });
  });

  it('shows error message if getPackageCost API fails', async () => {
    (api.getPackageCost as vi.Mock).mockRejectedValueOnce(new Error('Failed to get package cost'));

    render(<Cost />);

    const packageIdInput = screen.getByPlaceholderText(/enter package id/i);
    const button = screen.getByRole('button', { name: /get package cost/i });

    fireEvent.change(packageIdInput, { target: { value: 'TestPackageId' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(api.getPackageCost).toHaveBeenCalledWith('TestPackageId');
      expect(screen.getByText(/an error occurred. please try again later/i)).toBeInTheDocument();
    });
  });

  it('triggers get cost on Enter key press', async () => {
    (api.getPackageCost as vi.Mock).mockResolvedValueOnce({ cost: 150 });

    render(<Cost />);

    const packageIdInput = screen.getByPlaceholderText(/enter package id/i);
    fireEvent.change(packageIdInput, { target: { value: 'TestPackageId' } });
    fireEvent.keyPress(packageIdInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(api.getPackageCost).toHaveBeenCalledWith('TestPackageId');
      expect(screen.getByText(/package cost: \$150/i)).toBeInTheDocument();
    });
  });
});
