---
name: error-handling
description: "Review error handling and resilience — catches, timeouts, retries, cleanup. Use for code review involving I/O, external calls, or failure paths."
---

# Review error handling and resilience

1. Catch errors and handle them with meaningful messages; no silent
   swallowing.
2. External calls (HTTP/DB) need timeouts; retry with backoff where
   appropriate.
3. Distinguish expected failures (validation) from unexpected ones (bugs).
4. Clean up resources on failure paths; keep error types consistent.
