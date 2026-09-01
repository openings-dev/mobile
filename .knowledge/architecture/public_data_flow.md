# Public Data Flow

> Define the public Openings dataset boundary consumed by mobile discovery.

## Source of truth

The public `openings-dev/data-pipeline` repository collects and normalizes listings
published in supported GitHub communities. Its generated public JSON is the data
source for Openings clients. The original GitHub issue, discussion, or community
listing remains the authoritative destination for requirements, availability, and
application instructions.

Mobile reads the schema-6 manifest, its declared opportunity pages, communities,
and repository status from the public raw GitHub snapshot. The configured root is
`https://raw.githubusercontent.com/openings-dev/data-pipeline/main/snapshots/opportunities`.

## Intended request boundary

```text
OpeningsCatalogProvider
  -> TanStack Query
    -> bounded-batch catalog service and HTTPS URL builder
      -> public generated JSON
        -> unknown-data validation and normalization
          -> progressive typed catalog state
```

`src/services/openings-catalog.ts` owns transport and bounded batches.
`src/domain/openings/validation.ts` owns safe paths and schema narrowing. Screens
receive typed state and use pure discovery functions; they never cast responses.

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
