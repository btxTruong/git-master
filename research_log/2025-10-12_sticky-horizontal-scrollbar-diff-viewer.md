# Research Solution: Sticky Horizontal Scrollbar for Split Diff Viewer

## Executive Summary
- **Problem**: Users need to scroll to the bottom of long files to access horizontal scrollbars for viewing wide content in the split diff viewer
- **Recommended Solution**: Dual sticky proxy scrollbars in a fixed footer at the bottom of the component viewport
- **Key Benefits**: Always-visible horizontal scroll controls, preserved independent pane scrolling, native browser scrollbar behavior, minimal performance overhead
- **Implementation Effort**: Medium - estimated 4-6 hours for implementation and testing
- **Risk Assessment**: Low risk - isolated component change with well-established patterns, progressive enhancement approach

## Problem Analysis

### Current State
The `FullFileSplitDiffViewer` component located at `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/FullFileSplitDiffViewer.tsx` displays side-by-side diffs in a modal overlay.

**Current Architecture:**
- Modal dimensions: 95vw x 90vh (lines 32-33 in DiffModal.tsx)
- Split-pane layout with left (old) and right (new) content
- Vertical scrolling: Synchronized between panes via scrollContainer (lines 156-172)
- Horizontal scrolling: Independent per pane using `overflow-x-scroll` (lines 335 and 451)
- Content scrollers are nested inside a vertical scroll container

**Root Cause:**
The horizontal scrollbars are rendered inside each content pane at lines 335 and 451:
```typescript
<div className="flex-1 overflow-x-scroll overflow-y-hidden">
```

When content is tall (hundreds of lines), users must scroll vertically to the bottom to see and interact with these scrollbars. This creates a poor UX for files with long lines, as users lose context when scrolling down just to access horizontal navigation.

**Impact Assessment:**
- **Severity**: High - significantly degrades usability for wide files
- **Frequency**: Common - many code files exceed 80-120 character line width
- **User Impact**: Forces inefficient workflow (scroll down, scroll horizontally, scroll back up)
- **Alternative Workarounds**: None in current implementation

### Requirements

**Functional Requirements:**
1. Horizontal scrollbars must remain visible at bottom of viewport during vertical scrolling
2. Each pane (left/right) must maintain independent horizontal scroll control
3. Scrollbar thumb size must accurately reflect content width vs viewport width
4. Synchronization must be bidirectional (proxy bar ↔ content scroller)
5. Scrollbars must hide when content width fits within viewport (no horizontal overflow)

**Non-Functional Requirements:**
1. **Performance**: Scroll synchronization must feel native with no visible lag (<16ms)
2. **Accessibility**: Keyboard navigation (arrow keys, Page Up/Down) must work
3. **Responsiveness**: Must adapt to window resize and content changes
4. **Browser Compatibility**: Support all modern browsers (Chrome, Firefox, Safari, Edge)
5. **Visual Design**: Match existing Tailwind theme and dark mode support

**Constraints and Limitations:**
1. CSS `position: sticky` does not work for native scrollbars
2. Cannot make native scrollbars sticky within overflow containers
3. Must avoid state-based scroll sync (performance issues)
4. Modal has fixed dimensions but content is dynamic
5. Component already has complex scroll synchronization for vertical axis

## Research Findings

### Industry Best Practices

**From Web Research:**
1. **Sticky Scrollbar Pattern**: Native scrollbars cannot be made sticky; solution requires creating proxy scrollbar elements with `position: sticky` or fixed positioning
2. **Synchronization Mechanism**: Use `useRef` with direct DOM manipulation, avoid state management to prevent re-renders
3. **Performance Optimization**: Use `requestAnimationFrame` to batch scroll updates and prevent layout thrashing
4. **ResizeObserver**: Safe place to read `scrollWidth` and `clientWidth` without forcing synchronous layout

**From Open Source Projects:**
- **diff2html**: Implements sticky file headers but not sticky horizontal scrollbars
- **GitHub Desktop**: Has known issues with diff scroll jumping but no public implementation of sticky horizontal scrolls
- **GitLab**: Known user request for horizontal scroll improvement in side-by-side diffs

**From React Community:**
- **react-scroll-sync** library: Synchronizes scroll positions across multiple elements using refs
- **Medium article (Jan 2025)**: Demonstrates synchronized top/bottom horizontal scrollbars with React hooks
- **Stack Overflow patterns**: Consistently recommend `useRef` + `scrollLeft` manipulation over state-based approaches

### Approach 1: Dual Sticky Proxy Scrollbars in Footer

**Description:**
Create two independent proxy scrollbars in a fixed-height footer at the bottom of the component. Each proxy is a separate `<div>` with `overflow-x: auto` containing a spacer element whose width matches the actual content `scrollWidth`. Position footer as a flex sibling below the main scroll container.

**Architecture:**
```
Component Root (flex column)
├── Navigation buttons (existing)
├── Scroll container (flex-1, overflow-auto) [existing]
│   ├── Left pane content scroller [existing]
│   └── Right pane content scroller [existing]
└── Footer (new, fixed height ~16px)
    ├── Left proxy scrollbar (overflow-x: auto)
    │   └── Spacer div (width: leftContent.scrollWidth)
    └── Right proxy scrollbar (overflow-x: auto)
        └── Spacer div (width: rightContent.scrollWidth)
```

**Pros:**
- **Explicit control model**: Left bar controls left pane, right bar controls right pane - intuitive
- **Native scrollbar behavior**: Browser handles thumb sizing automatically
- **Simple implementation**: No active-pane selection or hover detection needed
- **Visual alignment**: Grid layout matches main panes for perfect column alignment
- **Minimal complexity**: Fewer edge cases than unified approach

**Cons:**
- **Vertical space**: Consumes ~16-20px at bottom of component
- **Duplicate scrollbars**: Two separate bars may initially confuse users expecting one
- **Implementation overhead**: Requires sync logic for both panes separately

**Implementation Considerations:**
1. Add refs to content scrollers: `leftContentRef`, `rightContentRef`
2. Add refs to proxy scrollers: `leftProxyRef`, `rightProxyRef`
3. Use ResizeObserver to track content dimensions and update spacer widths
4. Implement bidirectional scroll sync with re-entrancy guards
5. Hide proxy bars when `scrollWidth <= clientWidth` (no overflow)
6. Handle `isNewFile` case with single full-width right proxy bar

**Technical Details:**
- Footer grid: `grid grid-cols-2 gap-px` (matches main layout at line 317)
- Proxy height: 14-16px (Tailwind: `h-4`)
- Spacer: `<div style={{ width: contentScrollWidth }} />`
- Sync events: `scroll` listener on both content and proxy elements

### Approach 2: Single Unified Sticky Scrollbar with Active Pane Selection

**Description:**
Create one horizontal scrollbar at the bottom that controls whichever pane the user last interacted with or is hovering over. Use state to track active pane and apply scroll updates to that pane only.

**Architecture:**
```
Component Root (flex column)
├── Navigation buttons (existing)
├── Scroll container with pane interaction tracking
│   ├── Left pane with onMouseEnter handler
│   └── Right pane with onMouseEnter handler
└── Single unified proxy scrollbar
    └── Spacer div (width: activePaneScrollWidth)
```

**Pros:**
- **Space efficient**: Only one scrollbar, saves vertical space
- **Cleaner visual**: Fewer UI elements at bottom
- **Familiar pattern**: Similar to some IDE implementations

**Cons:**
- **Cognitive overhead**: Users must understand which pane is active
- **Discoverability**: Not immediately obvious how to control second pane
- **Implementation complexity**: Requires hover detection, focus management, visual indicators
- **Edge cases**: What happens when user scrolls while mouse is between panes?
- **Mobile/touchpad**: Hover detection doesn't work well on touch devices
- **Failure modes**: User might scroll wrong pane by accident

**Implementation Considerations:**
1. Add state: `activePaneId` ('left' | 'right')
2. Add visual indicator showing which pane is active
3. Handle mouse enter/leave events on panes
4. Update spacer width when active pane changes
5. Consider keyboard focus as additional activation method

### Approach 3: Overlay Sticky Scrollbars with Padding

**Description:**
Position proxy scrollbars as absolutely positioned overlays at the bottom of the viewport, and add equivalent `padding-bottom` to scroll container to prevent content from being obscured.

**Architecture:**
```
Component Root (relative positioning)
├── Navigation buttons
├── Scroll container (padding-bottom: 20px)
│   ├── Left pane content scroller
│   └── Right pane content scroller
└── Overlay footer (position: absolute, bottom: 0)
    ├── Left proxy scrollbar
    └── Right proxy scrollbar
```

**Pros:**
- **No layout shift**: Absolute positioning removes from document flow
- **Flexible placement**: Can be positioned anywhere
- **Conditional rendering**: Easy to show/hide without affecting layout

**Cons:**
- **Z-index management**: Must ensure scrollbars appear above content
- **Occlusion risk**: Could cover content if padding calculation is wrong
- **Resize complexity**: Must recalculate padding on window resize
- **Scrollbar visibility**: On macOS with overlay scrollbars, might look inconsistent

**Implementation Considerations:**
1. Set container to `position: relative`
2. Add `padding-bottom` equal to footer height (16-20px)
3. Absolute position footer: `absolute bottom-0 left-0 right-0`
4. Handle edge case where padding affects vertical scroll calculations

### Recommended Approach: Dual Sticky Proxy Scrollbars in Footer

**Rationale for Selection:**
1. **Preserves existing UX**: Independent horizontal scrolling per pane matches current behavior
2. **Mental model clarity**: Obvious mapping between proxy bar and content pane
3. **Simplest implementation**: No state for active pane, no hover detection, no visual indicators needed
4. **Lowest risk**: Isolated to footer addition, existing scroll logic unchanged
5. **Native performance**: Browser-native scrollbar behavior with minimal JS overhead
6. **Accessibility wins**: Each scrollbar is independently keyboard-accessible
7. **Proven pattern**: Used in many data-heavy applications (spreadsheets, tables)

**Why Not Single Unified?**
While space-efficient, the single scrollbar approach introduces usability confusion and implementation complexity that outweighs the ~16px vertical space savings. Users reviewing diffs often compare specific sections horizontally, and forcing active-pane selection disrupts this workflow.

**Why Not Overlay?**
The overlay approach adds z-index management complexity and potential occlusion bugs. The footer approach is more predictable and maintains layout integrity.

## Implementation Plan

### Phase 1: Setup and DOM Structure

**Tasks:**
1. Add refs for content scrollers at lines 335 and 451
   - `const leftContentRef = useRef<HTMLDivElement>(null);`
   - `const rightContentRef = useRef<HTMLDivElement>(null);`
2. Add refs for proxy scrollbars
   - `const leftProxyRef = useRef<HTMLDivElement>(null);`
   - `const rightProxyRef = useRef<HTMLDivElement>(null);`
3. Create state for spacer widths
   - `const [leftScrollWidth, setLeftScrollWidth] = useState(0);`
   - `const [rightScrollWidth, setRightScrollWidth] = useState(0);`
4. Insert footer structure after line 491 (end of scroll container)

**Deliverables:**
- Updated refs in component state section (after line 31)
- Footer JSX added before final closing `</div>` (after line 491)

**Timeline:** 1 hour

### Phase 2: Measurement and Visibility Logic

**Tasks:**
1. Create ResizeObserver effect to measure content dimensions
2. Compute spacer widths from `scrollWidth` of content elements
3. Determine visibility: hide proxy when `scrollWidth <= clientWidth`
4. Handle initial mount and content changes (when diff data changes)
5. Cleanup ResizeObserver on unmount

**Deliverables:**
- `useEffect` hook with ResizeObserver setup
- Helper function: `updateScrollbarDimensions()`
- Conditional rendering logic for proxy bars

**Timeline:** 1.5 hours

### Phase 3: Bidirectional Scroll Synchronization

**Tasks:**
1. Implement scroll event handlers with re-entrancy guards
2. Use `requestAnimationFrame` for performance
3. Create sync functions:
   - `syncLeftContentToProxy()`
   - `syncLeftProxyToContent()`
   - `syncRightContentToProxy()`
   - `syncRightProxyToContent()`
4. Add passive scroll listeners
5. Handle cleanup in effect return

**Deliverables:**
- Two `useEffect` hooks for scroll synchronization (left and right)
- Re-entrancy guards: `isSyncingLeft.current`, `isSyncingRight.current`
- RAF-based sync functions

**Timeline:** 2 hours

### Phase 4: Edge Cases and Polish

**Tasks:**
1. Handle `isNewFile` case: render only right proxy bar at full width
2. Handle window resize: re-measure and update spacer widths
3. Reset scroll positions on content change (contentKey change)
4. Add visual styling: border-top, background color, dark mode support
5. Test with various content sizes (no overflow, small overflow, large overflow)
6. Test with modal resize scenarios

**Deliverables:**
- Conditional layout for `isNewFile` case
- Window resize handler
- Styled footer with Tailwind classes
- Dark mode compatibility

**Timeline:** 1.5 hours

## Technical Details

### Code Structure

**Constants (add at top of file after existing constants):**
```typescript
const PROXY_SCROLLBAR_HEIGHT = 16; // pixels
```

**New Refs (add after line 31):**
```typescript
const leftContentRef = useRef<HTMLDivElement>(null);
const rightContentRef = useRef<HTMLDivElement>(null);
const leftProxyRef = useRef<HTMLDivElement>(null);
const rightProxyRef = useRef<HTMLDivElement>(null);
const isSyncingLeft = useRef(false);
const isSyncingRight = useRef(false);
```

**State for Dimensions (add after refs):**
```typescript
const [leftScrollWidth, setLeftScrollWidth] = useState(0);
const [rightScrollWidth, setRightScrollWidth] = useState(0);
const [leftClientWidth, setLeftClientWidth] = useState(0);
const [rightClientWidth, setRightClientWidth] = useState(0);
```

**ResizeObserver Effect:**
```typescript
useEffect(() => {
  const leftContent = leftContentRef.current;
  const rightContent = rightContentRef.current;

  if (!leftContent || !rightContent) return;

  const updateDimensions = () => {
    if (leftContent) {
      setLeftScrollWidth(leftContent.scrollWidth);
      setLeftClientWidth(leftContent.clientWidth);
    }
    if (rightContent) {
      setRightScrollWidth(rightContent.scrollWidth);
      setRightClientWidth(rightContent.clientWidth);
    }
  };

  // Initial measurement
  updateDimensions();

  // ResizeObserver for responsive updates
  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(updateDimensions);
  });

  resizeObserver.observe(leftContent);
  resizeObserver.observe(rightContent);

  return () => {
    resizeObserver.disconnect();
  };
}, []);
```

**Left Pane Scroll Sync Effect:**
```typescript
useEffect(() => {
  const leftContent = leftContentRef.current;
  const leftProxy = leftProxyRef.current;

  if (!leftContent || !leftProxy) return;

  const syncContentToProxy = () => {
    if (isSyncingLeft.current) return;
    isSyncingLeft.current = true;
    requestAnimationFrame(() => {
      if (leftProxy) {
        leftProxy.scrollLeft = leftContent.scrollLeft;
      }
      isSyncingLeft.current = false;
    });
  };

  const syncProxyToContent = () => {
    if (isSyncingLeft.current) return;
    isSyncingLeft.current = true;
    requestAnimationFrame(() => {
      if (leftContent) {
        leftContent.scrollLeft = leftProxy.scrollLeft;
      }
      isSyncingLeft.current = false;
    });
  };

  leftContent.addEventListener('scroll', syncContentToProxy, { passive: true });
  leftProxy.addEventListener('scroll', syncProxyToContent, { passive: true });

  return () => {
    leftContent.removeEventListener('scroll', syncContentToProxy);
    leftProxy.removeEventListener('scroll', syncProxyToContent);
  };
}, []);
```

**Right Pane Scroll Sync Effect (similar to left):**
```typescript
// Same pattern as left pane, using rightContentRef and rightProxyRef
```

**Footer JSX (insert after line 491):**
```typescript
{/* Sticky horizontal scrollbars footer */}
{!isNewFile && (leftScrollWidth > leftClientWidth || rightScrollWidth > rightClientWidth) && (
  <div className="grid grid-cols-2 gap-px bg-gray-300 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600">
    {/* Left proxy scrollbar */}
    {leftScrollWidth > leftClientWidth && (
      <div
        ref={leftProxyRef}
        className="h-4 overflow-x-auto overflow-y-hidden bg-white dark:bg-gray-900"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div style={{ width: leftScrollWidth, height: '1px' }} />
      </div>
    )}
    {leftScrollWidth <= leftClientWidth && (
      <div className="h-4 bg-white dark:bg-gray-900" />
    )}

    {/* Right proxy scrollbar */}
    {rightScrollWidth > rightClientWidth && (
      <div
        ref={rightProxyRef}
        className="h-4 overflow-x-auto overflow-y-hidden bg-white dark:bg-gray-900"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div style={{ width: rightScrollWidth, height: '1px' }} />
      </div>
    )}
    {rightScrollWidth <= rightClientWidth && (
      <div className="h-4 bg-white dark:bg-gray-900" />
    )}
  </div>
)}

{/* Single proxy scrollbar for new files */}
{isNewFile && rightScrollWidth > rightClientWidth && (
  <div className="bg-gray-300 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600">
    <div
      ref={rightProxyRef}
      className="h-4 overflow-x-auto overflow-y-hidden bg-white dark:bg-gray-900"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div style={{ width: rightScrollWidth, height: '1px' }} />
    </div>
  </div>
)}
```

**Update Content Scroller Elements:**

At line 335 (left pane content scroller):
```typescript
<div ref={leftContentRef} className="flex-1 overflow-x-scroll overflow-y-hidden">
```

At line 451 (right pane content scroller):
```typescript
<div ref={rightContentRef} className="flex-1 overflow-x-scroll overflow-y-hidden">
```

### Configuration Changes
No configuration file changes needed. All changes are isolated to `FullFileSplitDiffViewer.tsx`.

### API Specifications
No API changes. This is purely a UI enhancement within the component.

## Testing Strategy

### Unit Testing Approach
Tests should be in `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/FullFileSplitDiffViewer.test.tsx`

**Test Cases:**
1. **Refs are properly attached**
   - Test that content refs reference actual DOM elements
   - Test that proxy refs reference actual DOM elements

2. **Visibility logic**
   - Test proxy bars hidden when content width <= viewport width
   - Test proxy bars visible when content width > viewport width
   - Test only right proxy visible when `isNewFile=true`

3. **Scroll synchronization**
   - Test scrolling content updates proxy `scrollLeft`
   - Test scrolling proxy updates content `scrollLeft`
   - Test synchronization does not create infinite loop

4. **ResizeObserver behavior**
   - Test dimensions updated on window resize
   - Test spacer width matches content `scrollWidth`
   - Test ResizeObserver cleanup on unmount

5. **Edge cases**
   - Test with empty content (no lines)
   - Test with very wide content (scrollWidth >> clientWidth)
   - Test content change resets scroll positions
   - Test dark mode styling applied

**Testing Notes:**
- Mock ResizeObserver in test environment (jsdom doesn't include it)
- Use `waitFor` for async dimension updates
- Use `fireEvent.scroll` to test synchronization
- Avoid mocking scroll behavior excessively - test real logic

### Integration Testing Requirements

**Manual Testing Scenarios:**
1. Open a diff with long lines (>200 characters per line)
2. Verify scrollbars appear at bottom of modal
3. Scroll horizontally using proxy bar, verify content scrolls
4. Scroll content horizontally, verify proxy bar scrolls
5. Resize browser window, verify scrollbars update
6. Test with new file (only old content exists)
7. Test with deleted file (only new content exists)
8. Test vertical scrolling does not affect horizontal position
9. Test dark mode appearance
10. Test keyboard navigation (Tab to scrollbar, arrow keys to scroll)

### Performance Testing Criteria

**Metrics to Monitor:**
1. **Frame rate during scroll**: Should maintain 60fps
   - Use Chrome DevTools Performance tab
   - Record scrolling session
   - Check for frame drops or long tasks

2. **Memory usage**: No memory leaks
   - Monitor memory over 5 minutes of continuous use
   - Check ResizeObserver cleanup
   - Verify event listener cleanup

3. **Scroll sync latency**: <16ms between proxy and content
   - Measure time between proxy scroll event and content update
   - Should feel instantaneous to user

4. **ResizeObserver overhead**: <5ms per callback
   - Use Performance observer to measure callback duration

**Performance Targets:**
- Scroll sync latency: <16ms (one frame at 60fps)
- ResizeObserver callback: <5ms
- Memory delta after 100 opens/closes: <10MB
- No forced synchronous layouts (verify in DevTools)

### Validation Methods

**Visual Regression Testing:**
1. Take screenshots of footer with scrollbars in light mode
2. Take screenshots of footer with scrollbars in dark mode
3. Compare with baseline screenshots
4. Verify alignment with pane columns

**Accessibility Testing:**
1. **Keyboard navigation**: Tab to scrollbar, use arrow keys
2. **Screen reader**: Verify scrollbars announced correctly
3. **High contrast mode**: Test visibility in Windows high contrast
4. **Focus indicators**: Verify visible focus state on scrollbars

**Cross-Browser Testing:**
1. Chrome (latest): Full functionality
2. Firefox (latest): Full functionality
3. Safari (latest): Full functionality, test overlay scrollbar behavior
4. Edge (latest): Full functionality

**User Acceptance Criteria:**
- [ ] Scrollbars always visible at bottom of viewport during vertical scroll
- [ ] Horizontal scroll works via proxy bar
- [ ] Content scroll syncs to proxy bar
- [ ] No visual lag or jitter during scroll
- [ ] Scrollbars hide when content fits in viewport
- [ ] Works with new files (single proxy bar)
- [ ] Works in dark mode
- [ ] Keyboard accessible
- [ ] Performance acceptable (60fps scrolling)

## Risk Mitigation

### Identified Risks

**Risk 1: Scroll Synchronization Infinite Loop**
- **Severity**: High
- **Likelihood**: Medium
- **Impact**: Component becomes unresponsive, browser may hang

**Mitigation Strategy:**
- Use re-entrancy guards (`isSyncingLeft.current`, `isSyncingRight.current`)
- Set guard to true before sync, false after
- Check guard at start of each sync function and return early if true
- Add defensive timeout to reset guard if sync takes too long (>100ms)

**Rollback Plan:**
- Remove scroll event listeners
- Fall back to existing behavior (scrollbars in content)

**Risk 2: ResizeObserver Performance Impact**
- **Severity**: Medium
- **Likelihood**: Low
- **Impact**: Laggy scroll or resize performance

**Mitigation Strategy:**
- Use `requestAnimationFrame` to throttle dimension updates
- Only observe content scrollers, not entire component tree
- Disconnect observer on unmount
- Measure callback duration in production (use Performance API)

**Rollback Plan:**
- Replace ResizeObserver with window resize listener
- Add debouncing to reduce update frequency

**Risk 3: Browser Scrollbar Styling Inconsistencies**
- **Severity**: Low
- **Likelihood**: Medium
- **Impact**: Scrollbars look different across browsers

**Mitigation Strategy:**
- Accept native scrollbar styling per browser (best practice)
- Test on macOS (overlay scrollbars) and Windows (always-visible scrollbars)
- Add `scrollbar-gutter: stable` to prevent layout shift
- Consider custom scrollbar styling with CSS if necessary (future enhancement)

**Rollback Plan:**
- Remove custom scrollbar CSS
- Document known differences in README

**Risk 4: Z-Index Conflicts with Modal Overlays**
- **Severity**: Low
- **Likelihood**: Low
- **Impact**: Scrollbars hidden behind other UI elements

**Mitigation Strategy:**
- Use relative z-index within component (no absolute z-index values)
- Test with any overlays that might appear on top of diff modal
- Ensure footer is last in DOM order within modal (natural stacking)

**Rollback Plan:**
- Add explicit z-index if conflicts arise
- Move footer to absolute positioning if necessary

**Risk 5: Mobile/Touch Device Compatibility**
- **Severity**: Medium
- **Likelihood**: Medium
- **Impact**: Touch scrolling may not work properly on proxy bars

**Mitigation Strategy:**
- Test on iPad and Android tablets
- Ensure touch events propagate correctly
- Add touch-action CSS property if needed
- Consider hiding proxy bars on small screens (<768px) where horizontal scroll is less common

**Rollback Plan:**
- Hide footer on mobile breakpoints
- Rely on native content scrolling on touch devices

### Monitoring Requirements

**Production Monitoring:**
1. **Error tracking**: Monitor for JavaScript errors related to scroll sync
   - Track "Cannot read property 'scrollLeft'" errors
   - Monitor ResizeObserver errors

2. **Performance metrics**: Track scroll performance via RUM
   - Long task duration during scroll
   - Frame drops during scroll events

3. **User analytics**: Track usage patterns
   - Frequency of horizontal scrolling
   - Time spent scrolling horizontally
   - Browser/OS distribution of users experiencing issues

**Logging:**
```typescript
// Add development-only logging
if (process.env.NODE_ENV === 'development') {
  console.debug('StickyScrollbar: Dimensions updated', {
    leftScrollWidth,
    leftClientWidth,
    rightScrollWidth,
    rightClientWidth,
  });
}
```

## References

### Documentation Links
1. [ResizeObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
2. [ResizeObserver: Safe for scrollWidth/clientWidth](https://tigeroakes.com/posts/resize-observer-avoid-forced-sync-layout/)
3. [React useRef Hook](https://react.dev/reference/react/useRef)
4. [requestAnimationFrame MDN](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
5. [Passive Event Listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive)

### Code Repository References
- **Primary File**: `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/FullFileSplitDiffViewer.tsx`
- **Parent Component**: `/Users/truongbui/GolandProjects/git-master/frontend/src/components/commit/DiffModal.tsx`
- **Related Components**:
  - `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/SplitDiff.tsx` (similar split view pattern)
  - `/Users/truongbui/GolandProjects/git-master/frontend/src/components/diff/VirtualizedSplitDiff.tsx` (virtualized variant)
- **Existing Hooks**: `/Users/truongbui/GolandProjects/git-master/frontend/src/hooks/useDebounce.ts` (can be adapted for scroll debouncing if needed)

### External Resources
1. [Medium: Synchronized horizontal scrollbars with React (Jan 2025)](https://medium.com/@dev.bijay04/implement-two-synchronized-horizontal-scrollbars-top-bottom-with-reactjs-74a3860ebce6)
2. [react-scroll-sync library](https://github.com/okonet/react-scroll-sync)
3. [diff2html: Open source diff viewer](https://github.com/rtfpessoa/diff2html)
4. [Stack Overflow: Synchronize scroll of two React components](https://stackoverflow.com/questions/41290824/synchronise-scroll-of-two-react-components-without-using-state-and-actions)
5. [CSS Tricks: Dealing with overflow and position sticky](https://css-tricks.com/dealing-with-overflow-and-position-sticky/)

### Industry Standards
1. **WCAG 2.1 Scrolling Requirements**: Ensure keyboard accessibility for scrollable regions
2. **Performance Budget**: Maintain 60fps scrolling per Web Vitals guidelines
3. **React Best Practices**: Use refs for DOM manipulation, avoid state for high-frequency updates
4. **Accessibility**: Follow WAI-ARIA best practices for scrollable regions

## Research Process Summary

### GPT-5 Model Discussion Summary

**Key Insights Gained:**
1. **Dual vs Single Scrollbar**: GPT-5 model strongly recommended dual proxy scrollbars over single unified approach, citing mental model clarity and reduced edge cases
2. **Footer vs Overlay**: Advised against overlay approach due to z-index complexity and potential occlusion issues
3. **Native Scrollbar Benefits**: Emphasized using native browser scrollbars with spacer divs for automatic thumb sizing rather than custom scrollbar implementations
4. **Performance Patterns**: Detailed guidance on using RAF, re-entrancy guards, and ResizeObserver for optimal performance
5. **Alignment Strategy**: Suggested mirroring the same grid layout for footer as main panes to ensure perfect visual alignment

**Alternative Perspectives Considered:**
- **Hover-based single scrollbar**: Dismissed due to discoverability issues and mobile incompatibility
- **Top placement**: Considered placing scrollbars at top near headers for visibility, but bottom placement is more conventional
- **Gesture-only enhancements**: Shift+Wheel for horizontal scroll was suggested as complementary feature, not primary solution
- **Soft-wrapping**: Rejected for diff viewers as it breaks line alignment

**Validation of Solution Approach:**
GPT-5 model validated the dual footer approach as the optimal solution, confirming alignment with React best practices and diff viewer UX patterns. Provided detailed line-by-line implementation guidance with specific references to the codebase.

### Solution Development Process

**Research Methodology Used:**
1. **Codebase Analysis**: Read and analyzed existing components to understand current architecture
   - Examined `FullFileSplitDiffViewer.tsx` structure and scroll implementation
   - Reviewed parent component `DiffModal.tsx` for layout constraints
   - Checked related components for patterns (SplitDiff, VirtualizedSplitDiff)
   - Investigated existing hooks (useDebounce) for reusable patterns

2. **Web Research**: Searched for industry best practices and existing implementations
   - Query 1: "sticky horizontal scrollbar bottom viewport React TypeScript 2025"
   - Query 2: "CSS position sticky horizontal scrollbar always visible"
   - Query 3: "synchronized horizontal scrolling two panes React patterns"
   - Query 4: "ResizeObserver React hook scrollWidth clientWidth performance"
   - Query 5: "prevent scroll event feedback loop React useRef pattern"
   - Query 6: "horizontal scroll accessibility keyboard shift wheel React"
   - Query 7: "GitHub diff viewer sticky scrollbar implementation"
   - Query 8: "GitLab VSCode diff viewer horizontal scroll UX patterns"

3. **Expert Consultation**: Engaged with GPT-5 model for architectural validation
   - Presented problem context, current architecture, and constraints
   - Received detailed architectural recommendations
   - Validated approach against React best practices
   - Obtained line-specific implementation guidance

4. **Context7 Research**: Checked for relevant library documentation
   - No specific library found for sticky scrollbars
   - ResizeObserver is native browser API (well-documented)
   - React hooks are well-understood standard patterns

5. **Cross-Validation**: Compared findings from multiple sources
   - Web research confirmed useRef + RAF pattern
   - GPT-5 model validated dual scrollbar approach
   - Open source projects showed various implementation attempts
   - Community consensus on avoiding state-based scroll sync

**Decision-Making Criteria:**
1. **Simplicity**: Prefer simpler solutions with fewer edge cases
2. **Performance**: Maintain 60fps scrolling, avoid layout thrashing
3. **Standards Compliance**: Follow CLAUDE.md guidelines (no magic numbers, full variable names, SOLID principles)
4. **User Experience**: Intuitive behavior matching user mental models
5. **Maintainability**: Code should be easy to understand and modify
6. **Risk Management**: Choose lower-risk approaches with clear rollback paths

**How Final Solution Was Determined:**
1. Started with three candidate approaches (dual, single, overlay)
2. Evaluated each against criteria (simplicity, performance, UX)
3. GPT-5 model consultation confirmed dual footer as optimal
4. Web research validated technical implementation patterns
5. Codebase analysis confirmed feasibility within existing architecture
6. Selected Approach 1 (Dual Sticky Proxy Scrollbars in Footer)

**Lessons Learned During Research:**
1. **Native scrollbars are preferred**: Custom scrollbar implementations add complexity without significant UX benefit
2. **ResizeObserver is safe for measurements**: Optimal place to read layout properties without forced sync layout
3. **Re-entrancy guards are critical**: Simple boolean refs prevent infinite scroll loops effectively
4. **State-based scroll sync is anti-pattern**: Causes performance issues due to excessive re-renders
5. **Browser scrollbar differences are acceptable**: Users expect native scrollbar styling per their OS
6. **Accessibility requires consideration**: Keyboard navigation must work for all interactive elements
7. **Grid alignment ensures visual consistency**: Mirroring main pane layout prevents misalignment issues
8. **Progressive enhancement approach**: Solution works without breaking existing functionality

## Additional Considerations

### Future Enhancements

**Keyboard Shortcuts Enhancement:**
Implement Shift+MouseWheel horizontal scroll on content panes for improved ergonomics without requiring proxy bar interaction.

**Implementation:**
```typescript
useEffect(() => {
  const leftContent = leftContentRef.current;

  const handleWheel = (e: WheelEvent) => {
    if (e.shiftKey && !e.deltaX) {
      e.preventDefault();
      leftContent.scrollLeft += e.deltaY;
    }
  };

  leftContent?.addEventListener('wheel', handleWheel);
  return () => leftContent?.removeEventListener('wheel', handleWheel);
}, []);
```

**Long Line Indicator:**
Add visual indicator in pane headers when lines exceed viewport width, improving discoverability of horizontal scroll need.

**Custom Scrollbar Styling:**
Future consideration for custom scrollbar styling using CSS `scrollbar-*` properties for consistent cross-browser appearance. Not recommended for initial implementation due to complexity.

**Touch Device Optimization:**
Consider hiding footer on small touchscreen devices (<768px) where horizontal scrolling is less common and screen space is precious.

### Alternative Future Directions

**Minimap/Overview Panel:**
GitHub-style minimap showing full file width with viewport indicator. High implementation cost, consider only if user feedback indicates need.

**Horizontal Zoom Controls:**
Add zoom in/out buttons to scale font size, reducing horizontal scroll need. May conflict with browser zoom functionality.

**Smart Line Wrapping:**
Intelligent wrapping at syntax boundaries for long lines. Complex to implement correctly for diffs; alignment challenges.

## Conclusion

The dual sticky proxy scrollbar approach provides a robust, performant, and user-friendly solution to the horizontal scrolling visibility problem in the split diff viewer. The solution:

- **Solves the core problem**: Horizontal scrollbars always visible
- **Preserves existing UX**: Independent pane control maintained
- **Minimal risk**: Isolated component change with clear rollback options
- **Performance optimized**: RAF-based sync, ResizeObserver measurement
- **Accessible**: Keyboard navigation supported
- **Standards compliant**: Follows CLAUDE.md guidelines and React best practices

**Implementation Readiness:** This solution is ready for implementation with clear specifications, test strategies, and risk mitigation plans in place. Estimated effort is 4-6 hours for a complete, tested implementation.

**Next Steps:**
1. Create feature branch: `feature/sticky-horizontal-scrollbar`
2. Implement Phase 1: DOM structure and refs
3. Implement Phase 2: ResizeObserver measurement
4. Implement Phase 3: Scroll synchronization
5. Implement Phase 4: Edge cases and polish
6. Write tests per testing strategy
7. Manual QA across browsers
8. Code review and merge to main

**Success Metrics:**
- User feedback: Reduced friction accessing horizontal scroll
- Performance: Maintains 60fps during scroll
- Accessibility: WCAG 2.1 compliance verified
- Browser compatibility: Works in Chrome, Firefox, Safari, Edge
- Zero regressions: Existing functionality unchanged
