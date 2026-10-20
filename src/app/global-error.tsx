"use client";

/** Last-resort fallback if the root layout itself fails. It cannot rely on the site's styles. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: "40rem", margin: "4rem auto", padding: "0 1rem", lineHeight: 1.5 }}>
        <h1>QDA2 Interactive Lab could not be displayed</h1>
        <p>Something went wrong while loading the page. Your saved progress is not affected.</p>
        <p>
          <button type="button" onClick={reset}>
            Try again
          </button>{" "}
          or {/* A full page load on purpose: the client router may be what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">go to the start page</a>.
        </p>
      </body>
    </html>
  );
}
