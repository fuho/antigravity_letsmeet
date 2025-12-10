# TODO - Features and fixes

## Features

- [ ] POI (Points of Interest)
  - [ ] Add POI types for Cafe, Restaurant, Pub, Bar, Coffee Shop, etc.
  - the user can select which POIs should be shown in (and very close to) the sweet spot
- [ ] Mobile version
  - the app has to be responsive and work on mobile devices
- [ ]  Shareable links
  - the user should be able to share the current project with others
  - we might run into max URL length issues, so we should compress the data or check if not possible in some cases, then we could remove the name, or address and just share the coords for example...think about this

## Fixes

- [x]  When I hover(or select) a location, the location should be highlighted in the toolbar
- [ ] Max travel time slider should start at zero (but only allow values between MIN and MAX, for now we can hardcode MIN and MAX to 5 and 60) [things to consider, how granular should we go, should we go all the way down to a minute?]
- [ ] When I use a preset ( or saved project from before) let me save the changes I make to it, without having to fill in new project name. If I want to save it as a new project, I should be able to do that too. And if I am overwriting an existing project, I should be asked for confirmation.
- [x] When I hover(select on mobile) a location:
  - [x] the location should be highlighted in the toolbar
  - [x] the location name should be in the popup
  - [x] there should be a simple way to remove the location
- [ ] when clicking on the map (when the broser is not in focus, so the users is coming back to the app the first click should not create a new location in that case)
- [x] There needs to be a way to edit the location name and address
  - [x] Inline editing in sidebar
  - [x] Delete confirmation dialog
- [x] Starting points should be renamed to something more human readable, like "Locations"
- [x] Locations should have an optional name, not just an address.
  - [x] this means you will have to find names for the locations from the books.
- [x] Locations in the toolbar probably don't have to show the coordinates, just the name and an address
