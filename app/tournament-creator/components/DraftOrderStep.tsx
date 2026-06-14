import React from 'react';

interface Props {
  isThreePlayer: boolean;
  players: string[];
  threeDraftOrder: string[];
  isCoinFlipping: boolean;
  coinResultText: string;
  displayedCoinOwner: string;
  displayedCoinFace: string;
  onGenerateThreeDraftOrder: () => void;
  onRunCoinFlip: () => void;
  onResetDraft: () => void;
}

export default function DraftOrderStep({
  isThreePlayer,
  players,
  threeDraftOrder,
  isCoinFlipping,
  coinResultText,
  displayedCoinOwner,
  displayedCoinFace,
  onGenerateThreeDraftOrder,
  onRunCoinFlip,
  onResetDraft,
}: Props) {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-5">
      <h2 className="text-2xl font-semibold">Étape 4 - {isThreePlayer ? 'Ordre de draft' : 'Pile ou face'}</h2>

      {isThreePlayer ? (
        <>
          <p className="text-slate-300 text-sm">
            Générez l'ordre de draft pour {players.join(', ')}.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGenerateThreeDraftOrder}
              className="brand-btn px-4 py-2 text-sm"
            >
              Générer l'ordre de draft
            </button>
            <button
              type="button"
              onClick={onResetDraft}
              className="outline-btn px-4 py-2 text-sm"
            >
              Réinitialiser
            </button>
          </div>

          {threeDraftOrder.length > 0 && (
            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-sm font-semibold text-slate-100 mb-3">Ordre de draft</p>
              <ol className="list-decimal list-inside text-slate-200 space-y-1">
                {threeDraftOrder.map((player, index) => (
                  <li key={`${player}-${index}`}>{player}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-slate-300 text-sm">
            Le gagnant du pile ou face choisira la première équipe.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRunCoinFlip}
              disabled={isCoinFlipping}
              className="brand-btn px-4 py-2 text-sm disabled:opacity-50"
            >
              Lancer la pièce
            </button>
            <button
              type="button"
              onClick={onResetDraft}
              disabled={isCoinFlipping}
              className="outline-btn px-4 py-2 text-sm disabled:opacity-50"
            >
              Réinitialiser
            </button>
          </div>

          <div className="coin-stage rounded-xl border border-white/15 bg-black/20 p-4">
            <button
              type="button"
              disabled
              className={`coin-visual ${isCoinFlipping ? 'is-flipping' : ''} ${displayedCoinFace === 'face' ? 'is-face coin-face-side' : 'coin-pile-side'}`}
              aria-label="Lancer la pièce"
            >
              <span className="coin-label">{isCoinFlipping ? '...' : displayedCoinOwner}</span>
            </button>
            <p className="text-sm text-slate-300 mt-3" aria-live="polite">
              {isCoinFlipping
                ? 'La pièce tourne...'
                : coinResultText || 'Aucun résultat pour le moment.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
