"use client";

/*
 * Dernier filet : une exception levée dans le layout racine lui-même, avant
 * que la coque n'existe. `global-error.tsx` remplace tout le document — il
 * doit donc porter ses propres <html> et <body>, et ne peut compter ni sur
 * les polices, ni sur la feuille de styles, ni sur les jetons de thème.
 * D'où les styles en ligne : c'est le seul endroit du projet où c'est justifié.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#F6F8FC",
          color: "#1A1D23",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 .5rem" }}>
            L&apos;application n&apos;a pas pu démarrer
          </h1>
          <p style={{ fontSize: ".875rem", lineHeight: 1.6, color: "#5A6072", margin: "0 0 1.5rem" }}>
            Une erreur inattendue est survenue. Rechargez la page ; si le
            problème persiste, signalez-le à un administrateur.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: "pointer",
              border: 0,
              borderRadius: ".625rem",
              padding: ".625rem 1.25rem",
              fontSize: ".875rem",
              fontWeight: 600,
              color: "#FFFFFF",
              background: "#0F7C4A",
            }}
          >
            Recharger
          </button>
          {error.digest && (
            <p style={{ marginTop: "1rem", fontSize: ".75rem", color: "#8A90A2" }}>
              Référence : {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
