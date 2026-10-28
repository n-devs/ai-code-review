---
name: api-contract
description: "Review API design and backward compatibility — endpoints, payloads, status codes, versioning. Use for code review touching routes, handlers, or public contracts."
---

# Review API design and backward compatibility

1. REST conventions: resource naming, correct status codes, pagination.
2. Breaking changes (removed/renamed fields and endpoints) must be flagged
   loudly.
3. Validate request payloads; document new params/fields (e.g. OpenAPI)
   where applicable.
4. Use versioning for incompatible changes.
