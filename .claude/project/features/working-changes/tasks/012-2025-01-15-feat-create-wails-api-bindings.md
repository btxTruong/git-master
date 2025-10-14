# Task: Create Wails API Bindings

## Description
Create TypeScript API wrappers for all Wails-bound changelist service methods. These provide type-safe, promise-based interfaces for frontend components to call backend services.

## Acceptance Criteria
- [ ] API file created: `frontend/src/api/changelist.ts`
- [ ] All CRUD operations wrapped with proper types
- [ ] Archive operations wrapped with proper types
- [ ] Error handling converts Go errors to TypeScript errors
- [ ] Return types match TypeScript interfaces
- [ ] Functions use async/await pattern consistently
- [ ] Documentation comments for each function
- [ ] Example usage in comments

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
