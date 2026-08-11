import { useState } from 'react'
import { playClick } from '../audio/sfx'
import { t } from '../i18n/t'

type MenuView = 'closed' | 'main' | 'confirm-exit' | 'confirm-restart'

export function GameMenu({
  onExit,
  onRestart,
  onOpenChange,
}: {
  onExit: () => void
  onRestart: () => void
  onOpenChange?: (open: boolean) => void
}) {
  const [view, setView] = useState<MenuView>('closed')

  function set(v: MenuView) {
    setView(v)
    onOpenChange?.(v !== 'closed')
  }

  function open() {
    playClick()
    set('main')
  }

  function close() {
    playClick()
    set('closed')
  }

  function askExit() {
    playClick()
    set('confirm-exit')
  }

  function askRestart() {
    playClick()
    set('confirm-restart')
  }

  function confirmYes() {
    playClick()
    const action = view
    set('closed')
    if (action === 'confirm-exit') onExit()
    else if (action === 'confirm-restart') onRestart()
  }

  function confirmNo() {
    playClick()
    set('main')
  }

  return (
    <>
      <button
        type="button"
        className="hud-icon-btn menu-trigger"
        onClick={open}
        aria-label={t('menu.open')}
      >
        ☰
      </button>

      {view !== 'closed' && (
        <div className="menu-overlay" role="dialog" aria-modal="true" aria-labelledby="game-menu-title">
          <button type="button" className="menu-backdrop" onClick={close} aria-label={t('menu.back')} />
          <div className="menu-sheet">
            {view === 'main' && (
              <>
                <h2 id="game-menu-title" className="menu-title">
                  {t('menu.title')}
                </h2>
                <button type="button" className="menu-btn menu-btn-restart" onClick={askRestart}>
                  {t('menu.restart')}
                </button>
                <button type="button" className="menu-btn menu-btn-exit" onClick={askExit}>
                  {t('menu.exit')}
                </button>
                <button type="button" className="menu-btn menu-btn-cancel" onClick={close}>
                  {t('menu.back')}
                </button>
              </>
            )}

            {view === 'confirm-exit' && (
              <>
                <h2 id="game-menu-title" className="menu-title">
                  {t('menu.confirm_exit')}
                </h2>
                <p className="menu-hint">{t('menu.confirm_hint')}</p>
                <div className="menu-yesno">
                  <button type="button" className="menu-btn menu-btn-yes" onClick={confirmYes}>
                    {t('menu.yes')}
                  </button>
                  <button type="button" className="menu-btn menu-btn-no" onClick={confirmNo}>
                    {t('menu.no')}
                  </button>
                </div>
              </>
            )}

            {view === 'confirm-restart' && (
              <>
                <h2 id="game-menu-title" className="menu-title">
                  {t('menu.confirm_restart')}
                </h2>
                <p className="menu-hint">{t('menu.confirm_hint')}</p>
                <div className="menu-yesno">
                  <button type="button" className="menu-btn menu-btn-yes" onClick={confirmYes}>
                    {t('menu.yes')}
                  </button>
                  <button type="button" className="menu-btn menu-btn-no" onClick={confirmNo}>
                    {t('menu.no')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
