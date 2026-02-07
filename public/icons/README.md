# PWA Icon Generation Instructions

The PWA icons couldn't be generated automatically. Please create or use existing icons:

## Option 1: Use Existing Favicon
Copy your existing favicon and resize it:
1. Copy `favicon.ico` from the app folder
2. Use an online tool like https://realfavicongenerator.net/ to generate PWA icons
3. Download and place icons in `public/icons/` folder

## Option 2: Create New Icons
Use a design tool or online generator:
1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload a square logo or create one (recommended: 512x512)
3. Generate icons for PWA
4. Download and extract to `public/icons/` folder

## Required Files
- `public/icons/icon-192x192.png` - 192x192 pixels
- `public/icons/icon-512x512.png` - 512x512 pixels
- `public/apple-touch-icon.png` - 180x180 pixels (optional but recommended for iOS)

## Design Recommendation
- Use a simple, recognizable symbol (e.g., calendar, resource symbol)
- Gradient background from dark blue (#1e3a8a) to purple (#7c3aed)
- White icon/symbol in the center
- Ensure it looks good when scaled down to small sizes
