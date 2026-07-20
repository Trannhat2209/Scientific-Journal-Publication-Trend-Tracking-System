import React from "react";

const fields = ["Title", "Abstract", "Year", "DOI"];

export default function PublicationVersionHistory({ versions, message, onRestore }) {
  return (
    <section className="admin-publication-version-history">
      <h3>Publication version history</h3>
      {message ? <p role="status">{message}</p> : null}
      {versions.map((version, index) => {
        const previous = versions[index + 1]?.snapshot || {};
        const snapshot = version.snapshot || {};
        const changedFields = fields.filter(
          (field) => previous[field] !== undefined && JSON.stringify(previous[field]) !== JSON.stringify(snapshot[field]),
        );
        return (
          <article key={version.id || version.versionNumber}>
            <div>
              <strong>v{version.versionNumber} · {version.changeType}</strong>
              <small>{new Date(version.createdAt).toLocaleString()}</small>
              <p>{changedFields.length ? `Changed: ${changedFields.join(", ")}` : "Initial snapshot"}</p>
              {changedFields.length ? (
                <details>
                  <summary>Compare old and new content</summary>
                  <div className="admin-version-side-by-side">
                    <div><strong>Previous version</strong></div>
                    <div><strong>Version {version.versionNumber}</strong></div>
                    {changedFields.flatMap((field) => [
                      <div key={`${field}-old`}><small>{field}</small><p>{String(previous[field] ?? "—")}</p></div>,
                      <div key={`${field}-new`}><small>{field}</small><p>{String(snapshot[field] ?? "—")}</p></div>,
                    ])}
                  </div>
                </details>
              ) : null}
            </div>
            {index > 0 ? <button type="button" onClick={() => onRestore(version.versionNumber)}>Restore</button> : null}
          </article>
        );
      })}
      {!versions.length ? <p>No persisted versions yet.</p> : null}
    </section>
  );
}
