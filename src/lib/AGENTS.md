# src/lib rules
- Reads that can exceed 1000 rows use src/lib/fetch-all.ts (keyset, chunked ids, errors throw), scoped to the current map — the data API caps replies at 1000.
