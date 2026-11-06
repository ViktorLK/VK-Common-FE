---
name: vk-copy-file
description: Copy a file to a specified destination safely.
---

## Steps

1. Ask the user for:
   - **Source**: the file path to copy from
   - **Destination**: the file path to copy to

2. Copy the file from source to destination using the appropriate workspace tool.

3. Confirm to the user:
   - ✅ File copied: `[source]` → `[destination]`
   - ❌ If failed, report the error message.

