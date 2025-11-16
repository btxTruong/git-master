# Task: Create Wails Bindings for Line Revert Methods

## Description
Expose the new line revert backend methods to the frontend through Wails bindings. This enables the React frontend to call Go backend methods for applying line-level reverts. Ensure proper type generation and error handling across the bridge.

## Acceptance Criteria
- [ ] Backend methods are exposed to frontend via Wails bindings
- [ ] TypeScript type definitions are generated in wailsjs/go/services/
- [ ] Frontend can successfully call RevertLineChanges method
- [ ] Frontend can successfully call RevertLineRangeChanges method
- [ ] Frontend can successfully call ValidateLineRevertPatch method
- [ ] Error messages from backend are properly propagated to frontend
- [ ] Type safety is maintained across Go-TypeScript boundary
- [ ] Generated TypeScript files follow project conventions

## Technical Considerations
- Methods are automatically bound by Wails framework
- Run wails dev to regenerate TypeScript bindings
- Check wailsjs/go/services/StagingService.d.ts for type definitions
- Verify error handling works correctly across the bridge
- Test async behavior with Promise-based calls from frontend
- Ensure method naming follows TypeScript conventions (PascalCase)
- Reminder: Use full descriptive variable names
- Reminder: No magic numbers in generated code
- Reminder: Keep files under 500 lines

## Dependencies
- Depends on: 001-2025-10-16-feat-backend-line-revert-service.md
- Blocks: 006, 014

## Estimated Effort
1-2 hours

## Implementation Notes

### Commands to Run
```bash
cd /Users/truongbui/GolandProjects/git-master
wails dev
```

### Verification Steps
1. Check that TypeScript definitions are generated
2. Import and call methods from React component
3. Verify error handling with intentionally bad inputs
4. Check network tab for proper request/response format

### Files Modified
- `wailsjs/go/services/StagingService.js` (auto-generated)
- `wailsjs/go/services/StagingService.d.ts` (auto-generated)

### Testing Strategy
- Create simple test component that calls each method
- Test with valid and invalid inputs
- Verify Promise resolution and rejection
- Check console for errors
