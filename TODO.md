# TODO - Features and fixes

## Features

- [ ] Mobile version
  - the app has to be responsive and work on mobile devices

## To Fix

- [ ] **Suggested Venues UX**: Not enough vertical space in sidebar for venues list. Current scrollable section feels awkward. Consider:
  - Moving venues to a collapsible section
  - Showing venues in a modal/overlay
  - Displaying venues on the map only (remove from sidebar)
  - Limiting to top 5-10 venues with "Show more" button
- [ ] **Max travel time slider**: Should start at 0, clamp values between 5 and 60 minutes with 1-minute granularity, and only trigger calculation when the slider handle is released (not while dragging).
- [ ] **Preset/saved project saving improvements**: Allow users to update an existing project (overwrite), save the current state as a new project, and add confirmation dialogs when overwriting.
- [ ] **Map click focus issue**: Prevent new location creation on the first map click when the browser window is not in focus. The first click should only focus the window. that too. And if I am overwriting an existing project, I should be asked for confirmation.
- [ ] when clicking on the map (when the broser is not in focus, so the users is coming back to the app the first click should not create a new location in that case)

## Done

### Features

- [x] POI (Points of Interest)
  - [x] Add POI types for Cafe, Restaurant, Pub, Bar, Coffee Shop, etc.
  - the user can select which POIs should be shown in (and very close to) the sweet spot
- [x] Shareable links
  - the user can share the current project with others via URL

### Fixes

- [x] When I hover(or select) a location, the location should be highlighted in the toolbar
- [x] When I hover(select on mobile) a location:
  - [x] the location should be highlighted in the toolbar
  - [x] the location name should be in the popup
  - [x] there should be a simple way to remove the location
- [x] There needs to be a way to edit the location name and address
  - [x] Inline editing in sidebar
  - [x] Delete confirmation dialog
- [x] Starting points should be renamed to something more human readable, like "Locations"
- [x] Locations should have an optional name, not just an address.
  - [x] this means you will have to find names for the locations from the books.
- [x] Locations in the toolbar probably don't have to show the coordinates, just the name and an address
