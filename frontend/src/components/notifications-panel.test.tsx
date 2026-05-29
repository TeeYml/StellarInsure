import React, { useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NotificationsPanel } from './notifications-panel';

function NotificationsHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>
        Open notifications
      </button>
      <NotificationsPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        returnFocusRef={triggerRef}
      />
    </>
  );
}

describe('NotificationsPanel', () => {
  it('uses modal dialog semantics and returns focus after Escape closes it', async () => {
    const user = userEvent.setup();
    render(<NotificationsHarness />);

    const trigger = screen.getByRole('button', {
      name: /open notifications/i,
    });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: /notifications/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByRole('button', { name: /close notifications panel/i })
    ).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('renders notification rows as native buttons with native keyboard activation', async () => {
    const user = userEvent.setup();

    render(<NotificationsPanel isOpen onClose={vi.fn()} />);

    const notification = await screen.findByRole('button', {
      name: /policy updated/i,
    });

    expect(notification.tagName).toBe('BUTTON');
    expect(notification).not.toHaveAttribute('role');
    expect(notification).not.toHaveAttribute('tabindex');
    expect(notification).toHaveClass('unread');

    notification.focus();
    await user.keyboard('{Enter}');

    expect(notification).toHaveClass('read');
  });
});
