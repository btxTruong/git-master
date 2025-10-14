# Task: Bind Changelist Service to Wails

## Description
Integrate the ChangelistService with Wails by creating the service instance, binding it to the app, and ensuring all methods are accessible from the frontend.

## Acceptance Criteria
- [x] ChangelistService instantiated in app.go
- [x] Service bound via GetChangelistService() method
- [x] All public methods callable from TypeScript
- [x] Service has access to existing RepositoryService and StagingService
- [x] TypeScript bindings generated correctly
- [x] Error types propagate correctly to frontend
- [x] Context passed to service for Wails runtime access

## Technical Considerations
- Add ChangelistService field to App struct
- Initialize in NewApp() constructor
- Create GetChangelistService() method for Wails binding
- Pass RepositoryService reference for repository path access
- Ensure struct fields have JSON tags for TypeScript generation
- Test all methods via frontend calls
- Document any binding limitations

## Dependencies
- Depends on: 002-010 (all backend services)
- Blocks: 012 Create Wails API bindings

## Estimated Effort
2 hours
