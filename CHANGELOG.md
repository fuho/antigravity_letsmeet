# Changelog

All notable changes to LetsMeet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-12-12

### Added

- **Transport Mode Selector**: Choose between walking 🚶, cycling 🚴, or driving 🚗 for travel time calculations
  - Isochrone zones now respect the selected transport mode
  - Transport mode persists in shared links and saved projects
  - Auto-recalculates map when transport mode changes
- **Transport Mode Tests**: Added test coverage for transport mode in share utilities

### Changed

- **Sidebar UX Improvements**:
  - "Add location" input moved to bottom of locations list
  - Travel time label now shows mode: "Max travel time: 30 min by walking"
  - Locations label changed to "from locations" for better readability

### Removed

- **Venue Types**: Temporarily disabled Dance 💃 and Shop 🛍️ venue types

## [1.4.0] - 2025-12-11

### Added

- **ESLint Configuration**: Fixed broken ESLint config (replaced flat config with `.eslintrc.js`)
- **Prettier Integration**: Added `.prettierrc` with `format` and `format:check` scripts
- **Unit Tests**: Added 44 new tests for utility functions
  - `geometry.test.ts` - intersection, bounding box, centroid, point-in-polygon
  - `share.test.ts` - encode/decode roundtrip, unicode handling
  - `poi.test.ts` - search points, deduplication, polygon filtering

### Changed

- **Sidebar Refactoring**: Reduced from 496 to 349 lines (30% smaller)
  - Extracted `useUrlSync` hook for URL sync and initialization
  - Extracted `useProjectManager` hook for project save/load/update
  - Extracted `VenueList` component
  - Extracted `AddressSearchInput` component

### Fixed

- Removed conflicting `@tailwindcss/postcss` v4 package (was causing white screen)
- Fixed unescaped entities in JSX (ESLint react/no-unescaped-entities)

## [1.1] - 2025-12-11

### Added

- **Shareable Links**: URL-based state encoding for easy project sharing
  - State automatically syncs to URL on any change
  - Share button with beautiful modal UI
  - One-click copy with visual feedback (checkmark)
  - Users can share by copying URL from address bar
- **Unicode Support**: Full support for international characters in location names and addresses
  - Fixed Base64 encoding to handle UTF-8 properly
  - Works with Cyrillic, emoji, and all Unicode characters

### Fixed

- Infinite URL loop prevention using `isLoadingFromUrl` ref guard
- TypeScript error in `loadProject` call (null vs undefined)
- Share link loading now prevents Prague default from overriding

## [1.0] - 2025-12-11

### Added

- **Inline Editing**: Click-to-edit location names and addresses directly in sidebar
- **Delete Confirmation**: Modal dialog to prevent accidental location removal
- **Interactive Map Popups**: Hover over markers to see location details
  - Display name and address (country removed for brevity)
  - Embedded remove button
  - Synced with sidebar highlighting
- **Bi-directional Highlighting**: Hover sync between map markers and sidebar items
- **Literary Location Names**: All preset cities now have book-themed location names
  - NYC, London, Paris, Moscow, Prague, Tokyo, Dublin, Lisbon, Istanbul, Buenos Aires

### Changed

- Redesigned sidebar header with prominent Share button
- Moved delete button to top-right corner of location items
- Fixed glowing orbs to be perfectly circular
- Removed blue focus outline from buttons

### Fixed

- Map popup styling (removed white border, improved appearance)
- Sidebar X button positioning and styling
- Focus outline issues on interactive elements

## [0.1.0] - Initial Release

### Added

- Core meeting point finder functionality
- Mapbox GL integration for interactive maps
- Isochrone calculation for travel time zones
- Sweet Spot visualization (optimal meeting area)
- Multiple city presets with book themes
- Project save/load functionality (localStorage)
- Drag-and-drop marker positioning
- Max travel time slider (5-60 minutes)
- POI search for meeting venues
- Dark mode UI with glassmorphism effects
- Responsive design
- Static export for Cloudflare Pages deployment

### Technical

- Next.js 13.5.6
- React 18.2.0
- Zustand for state management
- Mapbox GL JS for maps
- Turf.js for geospatial calculations
- TailwindCSS for styling
- TypeScript for type safety
