---
name: clean-code
description: "Review readability and maintainability — naming, function size, duplication, dead code. Use for code review of new or refactored logic."
---

# Review readability and maintainability

1. Names should reveal intent; flag abbreviations and misleading names.
2. Functions should do one thing; flag long functions and deep nesting
   (suggest guard clauses).
3. DRY: duplicated logic to extract; dead code and commented-out blocks to
   remove.
4. Magic numbers/strings should become named constants.
