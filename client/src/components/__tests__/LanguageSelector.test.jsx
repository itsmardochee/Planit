import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import LanguageSelector from '../LanguageSelector';

describe('LanguageSelector', () => {
  it('renders language selector with current language', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );

    const select = screen.getByRole('combobox', { name: /select language/i });
    expect(select).toBeInTheDocument();
  });

  it('displays English and French options', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );

    expect(
      screen.getByRole('option', { name: /english/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /français/i })
    ).toBeInTheDocument();
  });

  it('changes language to French when selected', () => {
    const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'fr' } });

    expect(changeLanguageSpy).toHaveBeenCalledWith('fr');
  });

  it('changes language to English when selected', () => {
    const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');

    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });

    expect(changeLanguageSpy).toHaveBeenCalledWith('en');
  });

  it('has correct CSS classes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );

    const select = screen.getByRole('combobox');
    expect(select.className).toContain('px-3');
    expect(select.className).toContain('py-2');
    expect(select.className).toContain('rounded-lg');
  });
});
