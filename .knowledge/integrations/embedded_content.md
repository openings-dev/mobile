# Embedded Content

> Define trusted in-app legal documents, navigation boundaries, and recovery behavior.

Openings embeds only the public privacy policy and terms of service from
`https://openings.dev`. The drawer sends a closed `privacy` or `terms` identifier
to the native web-content route. The screen maps that identifier to a compile-time
URL; route parameters never supply a URL directly.

## Navigation policy

The public `@trebla/managed-webview` package owns WebView lifecycle and navigation
policy. Privacy allows only the exact `/privacy` path and Terms allows only the
exact `/terms` path on the `https://openings.dev` origin. HTTP, credentials,
malformed URLs, other origins, and other paths never load inside the WebView.

The app uses main-document load readiness, a ten-second timeout, and the package's
built-in challenge detection. Loading content stays behind an opaque native cover.
A timeout, network or HTTP failure, process termination, detected challenge, or
external navigation unmounts the document and shows native recovery.

## Recovery and privacy

Recovery offers retry and an explicit browser action when the package provides a
validated fallback target. The app never opens another application automatically.
It sends no search text, saved jobs, viewed state, preferences, notification state,
analytics state, or other local data in legal-document URLs.

Openings owns the native header, six-locale labels, theme values, and recovery
presentation. The website remains the source of truth for the legal prose.
