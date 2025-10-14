# Task: Create Changelist Zustand Store

## Description
Create the main Zustand store for managing changelist state in the frontend. This store handles custom groups, file-to-group mappings, and coordinates with the backend API.

## Acceptance Criteria
- [ ] Store created in `frontend/src/stores/changelistStore.ts`
- [ ] State includes groups, pathToGroupIds map, selected items
- [ ] All CRUD actions implemented with backend API calls
- [ ] Optimistic updates with rollback on error
- [ ] Path-to-group reverse index maintained
- [ ] Loading and error states tracked
- [ ] Actions use full descriptive names
- [ ] Toast notifications for user feedback

## Technical Considerations
- Use curried Zustand syntax for TypeScript: `create<State>()()`
- Store only custom groups, not derived ones
- Maintain Map<string, string[]> for path lookups
- Update index whenever groups change
- Optimistically update UI, rollback on API error
- Use react-hot-toast for operation feedback
- Extract complex logic to helper functions
- Keep store under 500 lines

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 012 Create Wails API bindings

## Estimated Effort
5 hours
