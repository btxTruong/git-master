# Task: Implement Virtualization for Large Lists

## Description
Add virtualization to file and group lists to maintain performance with large numbers of items using @tanstack/react-virtual.

## Acceptance Criteria
- [ ] Group list virtualized if >50 groups
- [ ] File lists virtualized if >100 files
- [ ] Archive list virtualized if >50 archives
- [ ] Smooth scrolling maintained
- [ ] Selection state preserved
- [ ] Expand/collapse works with virtualization
- [ ] No performance degradation with 1000+ items

## Technical Considerations
- Use @tanstack/react-virtual (already in dependencies)
- Measure row heights for accurate virtualization
- Handle dynamic heights (expanded groups)
- Preserve scroll position on updates
- Consider overscan for smooth scrolling
- Test with large datasets (generate mock data)

## Dependencies
- Depends on: 020 Create changelist panel component
- Depends on: 024 Create archive list component

## Estimated Effort
5 hours
