# Task: Create Wails API Bindings

## Description
Create TypeScript API wrappers for all Wails-bound changelist service methods. These provide type-safe, promise-based interfaces for frontend components to call backend services.

## Acceptance Criteria
- [x] API file created: `frontend/src/api/changelist.ts`
- [x] All CRUD operations wrapped with proper types
- [x] Archive operations wrapped with proper types
- [x] Error handling converts Go errors to TypeScript errors
- [x] Return types match TypeScript interfaces
- [x] Functions use async/await pattern consistently
- [x] Documentation comments for each function
- [x] Example usage in comments

## Technical Considerations
- Import generated Wails bindings
- Use full descriptive function names matching backend
- Wrap all calls in try-catch for error handling
- Convert Go errors to Error objects
- Type parameters and returns explicitly
- Use existing API patterns from staging.ts
- Keep file organized by operation category
- Extract common error handling pattern

## Dependencies
- Depends on: 001 Create changelist models and types  
- Depends on: 011 Bind changelist service to Wails

## Estimated Effort
3 hours
