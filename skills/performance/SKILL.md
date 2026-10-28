---
name: performance
description: "Review performance and resource usage — queries, loops, memory, caching. Use for code review touching data access, hot paths, or large payloads."
---

# Review performance and resource usage

1. N+1 queries: queries or async calls inside loops.
2. Missing indexes for new query patterns; unbounded queries without
   LIMIT/pagination.
3. O(n^2) patterns and large in-memory payloads on hot paths.
4. Cache repeated expensive work; bound concurrency.
