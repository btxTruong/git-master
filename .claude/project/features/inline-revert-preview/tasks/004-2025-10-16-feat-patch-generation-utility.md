# Task: Create Patch Generation Utility

## Description
Implement TypeScript utility functions to generate Git patches from diff line data. These utilities will create properly formatted unified diff patches for single lines and line ranges that can be applied using git apply. The patch format must precisely match Git's expectations.

## Acceptance Criteria
- [ ] generateSingleLineRevertPatch function implemented for single line reverts
- [ ] generateBulkLineRevertPatch function implemented for consecutive lines
- [ ] Functions generate valid unified diff format patches
- [ ] Handle all change types: add, delete, modify
- [ ] Proper line number calculation for patches
- [ ] Handle edge cases (empty lines, whitespace-only changes)
- [ ] TypeScript types defined for all function parameters and return values
- [ ] Utility functions exported from dedicated file
- [ ] Comprehensive JSDoc comments added

## Technical Considerations
- Unified diff format: starts with diff --git, has ---, +++, and @@ headers
- Line numbers must be accurate for patch to apply correctly
- Added lines start with +, deleted lines with -, context lines with space
- Must handle context lines around changes for proper patch application
- Escape special characters in file paths
- Use FULL_PATCH_HEADER constant for repeated header strings
- Calculate hunk header correctly: @@ -oldStart,oldCount +newStart,newCount @@
- Reminder: Use full descriptive variable names
- Reminder: Extract magic numbers to named constants
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: None (can be developed in parallel with backend)
- Blocks: 006, 014

## Estimated Effort
5-6 hours

## Implementation Notes

### File Location
Create new file: `/Users/truongbui/GolandProjects/git-master/frontend/src/utils/patchGenerator.ts`

### Function Signatures
```typescript
export function generateSingleLineRevertPatch(
  filePath: string,
  lineNumber: number,
  changeType: 'add' | 'delete' | 'modify',
  originalLine: string,
  newLine: string
): string;

export function generateBulkLineRevertPatch(
  filePath: string,
  startLine: number,
  endLine: number,
  lines: Array<{
    original: string;
    new: string;
    type: 'add' | 'delete' | 'modify' | 'context';
  }>
): string;

export function validatePatchFormat(patch: string): boolean;
```

### Unified Diff Format Reference
```
diff --git a/file.txt b/file.txt
--- a/file.txt
+++ b/file.txt
@@ -10,3 +10,3 @@
 context line
-old line
+new line
 context line
```

### Testing Strategy
- Unit tests with various line types
- Test with real diff data from project
- Validate generated patches with git apply --check
- Test edge cases (empty lines, special characters)

### Edge Cases to Handle
- Empty lines (must still include + or - prefix)
- Lines with only whitespace
- Very long lines (ensure no truncation)
- File paths with spaces or special characters
- Lines at beginning/end of file
- Files with no newline at end
