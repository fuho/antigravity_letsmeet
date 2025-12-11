# Changelog

All notable changes to LetsMeet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
