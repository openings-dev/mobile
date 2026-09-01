# Public Data Flow

> Define the public Openings dataset boundary that future mobile features must consume.

## Source of truth

The public `openings-dev/data-pipeline` repository collects and normalizes listings
published in supported GitHub communities. Its generated public JSON is the data
source for Openings clients. The original GitHub issue, discussion, or community
listing remains the authoritative destination for requirements, availability, and
application instructions.

The current mobile foundation does not fetch this data yet. When the integration is
implemented, match the verified data-pipeline schema and endpoint configuration used
by the Openings product at that time instead of freezing assumptions from this
document.

## Intended request boundary

```text
Screen controller or feature hook
  -> domain query function
    -> URL builder and native fetch
      -> public generated JSON
        -> unknown-data validation and normalization
          -> typed screen state
```

Transport, parsing, validation, and domain queries live outside React components.
Screen code coordinates query inputs and explicit UI states but does not build remote
paths or cast network responses directly to domain types.

## Required rules

- centralize public base URLs and resource paths;
- use only public configuration and preserve documented override precedence;
- treat every parsed JSON payload as unknown until validated;
- accept an `AbortSignal` where a request can become stale;
- preserve useful HTTP, parsing, and network failures;
- never manufacture opportunity data after a failure;
- do not add credentials, a backend proxy, API routes, private feeds, automatic
  retries, or checked-in production snapshots;
- keep repository identifiers, canonical job IDs, URLs, and filter values
  locale-neutral;
- open the original listing through a deliberate, validated HTTPS action.

Public data may still contain untrusted text and URLs. Render text as text, validate
outbound destinations, and never execute remote content as application code.
