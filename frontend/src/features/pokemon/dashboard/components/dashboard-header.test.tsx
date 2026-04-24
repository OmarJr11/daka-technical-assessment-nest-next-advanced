import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardHeader } from './dashboard-header';

describe('DashboardHeader', () => {
  it('should render actions and trigger callbacks', async (): Promise<void> => {
    const user = userEvent.setup();
    const onLogout = vi.fn().mockResolvedValue(undefined);
    const onRequestSprite = vi.fn();
    const onDeleteAllSprites = vi.fn();
    const onRefreshSprites = vi.fn().mockResolvedValue(undefined);
    render(
      <DashboardHeader
        username="ash"
        isSocketConnected={true}
        socketStatusLabel="Connected"
        pendingRequestCount={2}
        isLoggingOut={false}
        canRequestSprite={true}
        hasSprites={true}
        isSyncingSprites={false}
        onLogout={onLogout}
        onRequestSprite={onRequestSprite}
        onDeleteAllSprites={onDeleteAllSprites}
        onRefreshSprites={onRefreshSprites}
        refreshLabel="Refresh Sprites"
      />,
    );
    expect(screen.getByText('Welcome, ash')).toBeInTheDocument();
    expect(screen.getByText(/Pending jobs: 2/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Request Sprite' }));
    await user.click(screen.getByRole('button', { name: 'Delete All' }));
    await user.click(screen.getByRole('button', { name: 'Refresh Sprites' }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(onRequestSprite).toHaveBeenCalledTimes(1);
    expect(onDeleteAllSprites).toHaveBeenCalledTimes(1);
    expect(onRefreshSprites).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
