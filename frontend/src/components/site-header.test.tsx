import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SiteHeader } from './site-header';

vi.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <button type="button">Language</button>,
}));

vi.mock('@/components/network-switcher', () => ({
  NetworkSwitcher: () => <button type="button">Network</button>,
}));

vi.mock('@/components/network-badge', () => ({
  NetworkBadge: () => <span>Testnet</span>,
}));

vi.mock('@/components/wallet-connection-button', () => ({
  WalletConnectionButton: () => <button type="button">Wallet</button>,
}));

vi.mock('@/components/command-palette', () => ({
  CommandPalette: () => <button type="button">Command palette</button>,
}));

vi.mock('@/components/keyboard-shortcuts-help', () => ({
  KeyboardShortcutsHelp: () => <button type="button">Keyboard help</button>,
}));

vi.mock('@/components/notifications-panel', () => ({
  NotificationsPanel: () => null,
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

describe('SiteHeader', () => {
  it('renders the mobile menu toggle as an icon button with a changing name', async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-controls', 'mobile-nav-drawer');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent('');
    expect(toggle.querySelector('svg')).toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAccessibleName('Close menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves focus into the mobile drawer and traps tab navigation', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SiteHeader />
        <a href="/outside">Outside link</a>
      </>
    );

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    await user.click(toggle);

    const drawer = document.getElementById('mobile-nav-drawer');
    expect(drawer).toBeInstanceOf(HTMLElement);

    const focusableElements = () =>
      Array.from(drawer!.querySelectorAll<HTMLElement>(focusableSelector));

    const firstFocusable = focusableElements()[0];
    await waitFor(() => expect(firstFocusable).toHaveFocus());

    const lastFocusable = focusableElements()[focusableElements().length - 1];
    lastFocusable.focus();

    await user.tab();
    expect(firstFocusable).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastFocusable).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAccessibleName('Open menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
