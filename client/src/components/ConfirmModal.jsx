import { useTranslation } from 'react-i18next';

/**
 * Reusable Tailwind confirmation modal (replaces window.confirm).
 * Renders nothing when `open` is false.
 */
const ConfirmModal = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation(['common']);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading
              ? t('common:messages.loading', { defaultValue: 'Loading...' })
              : t('common:buttons.confirm', { defaultValue: 'Confirm' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
