# Task: Add Loading States and Spinners

## Description
Implement comprehensive loading states for all async operations in the Working Changes feature, providing clear feedback to users.

## Acceptance Criteria
- [ ] Loading spinners during group operations
- [ ] Loading overlay for archive creation/restoration
- [ ] Loading state in diff preview pane
- [ ] Loading indicator during reconciliation
- [ ] Skeleton loaders for lists (optional)
- [ ] No blocking spinners for fast operations (<200ms)
- [ ] Consistent spinner styling

## Technical Considerations
- Use existing Spinner component
- Add isLoading flags to stores
- Show spinners for operations >200ms
- Disable UI during destructive operations
- Progress indicators for long operations (archives)
- Non-blocking for reconciliation
- Extract loading wrapper components

## Dependencies
- Depends on: 013 Create changelist Zustand store
- Depends on: 014 Create archive Zustand store

## Estimated Effort
3 hours
