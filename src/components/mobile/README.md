# Mobile-First UI Rewrite

A complete mobile UI rewrite inspired by modern apps like Turbo.ai, featuring gesture-driven interactions, smooth animations, and a native-feeling experience.

## 🎯 Key Features

### 1. **Bottom Navigation**
- 4 core tabs: Home, Tasks, Schedule, Buddy
- Smooth transitions with indicator animations
- Badge support for notifications (streak counter)
- Thumb-zone optimized for one-handed use

### 2. **Gesture-Driven Interactions**
- **Swipe right** on tasks → Mark complete
- **Swipe left** on tasks → More actions
- **Pull down** on bottom sheets → Dismiss
- **Drag handle** on sheets → Resize/snap

### 3. **Card-Based Feed**
- Contextual cards that adapt to user needs
- Daily quest progress
- Urgent tasks (overdue/due today)
- Today's classes
- Upcoming assignments
- Empty states with helpful CTAs

### 4. **Bottom Sheets**
- Native-feeling modals that slide from bottom
- Drag-to-dismiss support
- Multiple snap points (90%, 50%)
- Smooth animations with spring physics

### 5. **Touch-Optimized**
- Minimum 44px tap targets
- Large, easy-to-hit buttons
- Proper spacing for fat fingers
- No accidental taps

### 6. **Performance**
- 60fps animations
- Smooth scrolling with momentum
- Optimized re-renders
- Lazy loading where appropriate

## 📁 File Structure

```
src/components/mobile/
├── MobileApp.jsx              # Main mobile container
├── MobileHeader.jsx           # Top header with greeting
├── MobileNav.jsx              # Bottom navigation bar
├── FeedCard.jsx               # Reusable card component
├── SwipeableCard.jsx          # Card with swipe gestures
├── BottomSheet.jsx            # Modal that slides from bottom
├── views/
│   ├── HomeView.jsx           # Main feed view
│   ├── TasksView.jsx          # All tasks with filters
│   └── [more views...]
└── README.md                  # This file

src/styles/
└── mobile.css                 # All mobile-specific styles
```

## 🎨 Design Principles

### 1. **Mobile-First**
- Designed for mobile, works on desktop
- Touch interactions are primary
- Gestures feel natural and intuitive

### 2. **Progressive Disclosure**
- Show summaries first
- Tap to expand for details
- Bottom sheets for forms/actions

### 3. **Contextual Intelligence**
- Cards adapt to time of day
- Urgent items surface automatically
- Smart recommendations

### 4. **Delightful Animations**
- Smooth 60fps transitions
- Spring physics for natural feel
- Micro-interactions provide feedback

### 5. **Accessibility**
- Proper ARIA labels
- Keyboard navigation support
- High contrast ratios
- Screen reader friendly

## 🚀 Usage

The mobile UI automatically activates on mobile devices (width ≤ 768px) when a user is logged in:

```jsx
// In App.js
if(isMobile && user && loaded) {
  return <MobileApp {...props} />;
}
```

## 🎯 Views

### Home View
- Quick stats (active, urgent, classes, points)
- Daily quest progress
- Urgent tasks (swipeable)
- Today's classes
- Upcoming assignments
- FAB for adding tasks

### Tasks View
- Filter pills (Active, Done, All)
- Sort options (Date, Priority, Subject)
- Swipeable task cards
- Progress indicators
- Empty states

### Schedule View
- Coming soon...

### Buddy View
- Coming soon...

## 🎨 Customization

### Colors
Mobile UI uses CSS variables from the main theme:
- `--bg` - Background
- `--card` - Card background
- `--text` - Primary text
- `--text2` - Secondary text
- `--text3` - Tertiary text
- `--accent` - Primary accent color
- `--border` - Border color

### Animations
All animations use CSS transitions and transforms for 60fps performance:
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

## 📱 Responsive Breakpoints

- **Mobile**: ≤ 768px (Mobile UI active)
- **Desktop**: > 768px (Desktop UI active)

## 🔧 Future Enhancements

- [ ] Schedule view with calendar
- [ ] Buddy view with creature interaction
- [ ] Pull-to-refresh on home feed
- [ ] Haptic feedback on interactions
- [ ] Offline support with service worker
- [ ] Push notifications for due dates
- [ ] Widget support for home screen
- [ ] Siri/Google Assistant shortcuts

## 🐛 Known Issues

None yet! Report issues on GitHub.

## 📝 Notes

- The mobile UI is completely separate from desktop UI
- No shared components between mobile/desktop (clean separation)
- Mobile styles are in `mobile.css` (not in main styles.js)
- All mobile components are self-contained

## 🎉 Credits

Inspired by:
- Turbo.ai - Gesture-driven interactions
- Linear - Clean, minimal design
- Things 3 - Contextual task management
- Notion - Bottom sheets and modals
