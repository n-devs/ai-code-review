---
name: testing
description: "Review test coverage and test quality for the changed behavior. Use for code review where behavior changes should be verified by unit or integration tests."
---

# Review tests and behavior

1. Identify behavior changed by this diff that lacks unit/integration coverage.
2. Tests should cover the happy path, key edge cases (empty/null/boundary),
   and error paths.
3. Flag tests that mock everything and assert nothing meaningful.
4. Non-deterministic tests (time, random, network) should be controlled or
   faked.
