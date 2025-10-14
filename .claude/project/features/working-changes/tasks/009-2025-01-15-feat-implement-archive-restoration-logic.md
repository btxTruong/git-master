# Task: Implement Archive Restoration Logic

## Description
Implement archive restoration functionality that safely applies archived patches back to the working tree. Includes preflight checks, optional backup, and fallback strategies for conflicts.

## Acceptance Criteria
- [ ] RestoreArchiveToWorkingTree performs preflight check with `git apply --check`
- [ ] Optional backup creates stash of affected paths before applying
- [ ] Three-way merge attempted when base blobs available
- [ ] Fallback to --reject mode on conflicts
- [ ] Restoration does not modify Git index by default
- [ ] Detailed error messages for apply failures
- [ ] Reject files (.rej) surfaced to user if created
- [ ] Rollback via backup stash if restoration fails

## Technical Considerations
- Always run `git apply --check` before actual apply
- If check fails and backup requested, create stash first
- Try `git apply --3way` first for better merge
- Fall back to `git apply --reject` if 3way fails
- Parse Git apply output for detailed diagnostics
- Provide undo operation via stash pop
- Extract preflight logic to separate function
- Handle case where archive is very old

## Dependencies
- Depends on: 001 Create changelist models and types
- Depends on: 007 Implement archive directory management

## Estimated Effort
6 hours
