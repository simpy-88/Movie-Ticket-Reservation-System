# MTRS Cinematic Backdrops Directory

Place your widescreen, landscape cinematic backdrop images in this folder for use in the top homepage hero slideshow.

## Recommended Specifications
* **Orientation**: Landscape (Widescreen)
* **Aspect Ratio**: 16:9 or 2.39:1 (Cinemascope)
* **Resolution**: 1280x720, 1920x1080, or 2560x1440
* **Supported Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`

## How to Configure in `assets/posters.js`
Open `assets/posters.js` and edit the `POSTER_REGISTRY` entry for the desired movie:

```javascript
'M01': {
    id: 'M01',
    title: 'Superman',
    // ...
    customPoster: '', // Portrait poster for catalog card (e.g., 'assets/custom-posters/superman.jpg')
    customBackdrop: 'assets/backdrops/superman-widescreen.jpg', // Landscape hero background
    // ...
}
```

### Configuration Examples

1. **Backdrop only** (leaves movie catalogue card poster untouched):
   ```javascript
   customPoster: '',
   customBackdrop: 'assets/backdrops/superman-widescreen.jpg'
   ```

2. **Poster only** (leaves hero slideshow backdrop untouched):
   ```javascript
   customPoster: 'assets/custom-posters/superman-portrait.jpg',
   customBackdrop: ''
   ```

3. **Both custom poster and backdrop**:
   ```javascript
   customPoster: 'assets/custom-posters/superman-portrait.jpg',
   customBackdrop: 'assets/backdrops/superman-widescreen.jpg'
   ```

## Programmatic API
You can also set or clear overrides dynamically in JavaScript via `window.MTRSPosters`:

```javascript
// Set custom backdrop only
window.MTRSPosters.setCustomBackdrop('M01', 'assets/backdrops/superman-widescreen.jpg');

// Set custom poster only
window.MTRSPosters.setCustomPoster('M01', 'assets/custom-posters/superman-portrait.jpg');

// Set both together
window.MTRSPosters.setMovieOverrides('M01', {
    poster: 'assets/custom-posters/superman-portrait.jpg',
    backdrop: 'assets/backdrops/superman-widescreen.jpg'
});

// Clear an override (reverts to default)
window.MTRSPosters.setCustomBackdrop('M01', '');
```
