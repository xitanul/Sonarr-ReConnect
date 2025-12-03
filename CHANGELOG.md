# Changelog

All notable changes to this project will be documented in this file.

## [3.0.5] - 2025-12-02

### Fixed
- Fixed Series tab crash when network transitions result in incomplete API data
- Added defensive null checks to handle series without statistics gracefully
- Implemented cache validation to prevent storing incomplete data
- Added automatic cache recovery for corrupted data

## [3.0.4] - 2025-11-30

### Fixed
- Removed unwanted gap between tab navigation and content area by adding negative margin to `.list` class in CSS, restoring the original compact layout

## [3.0.3] - Previous Release

### Security
- Restricted extension permissions to specific Sonarr URL only

## [3.0.2] - Previous Release

### Security
- Implemented Principle of Least Privilege for host permissions
- Added migration UI for existing users

## [3.0.1] - Previous Release

### Changed
- Removed jQuery dependency, migrated to Vanilla JS and Fetch API
- Refactored monolithic codebase into modular ES Modules architecture

### Fixed
- Fixed list visibility issue where last series was cut off by bottom menu
