# Store screenshots

Upload the files in their order. They are slices of one wide picture, so the order matters.

- `ios/`: App Store, 6.9-inch iPhone, 1320 × 2868.
- `ios-6.3/`: App Store, 6.3-inch iPhone, 1206 × 2622. Use this set if App Store Connect asks for
  the 6.1-inch or the 6.3-inch display.
- `play/`: Google Play, phone, 1080 × 1920.

Each `panorama.png` is the whole picture. Keep it for reference.

## How to make them again

The raw screens come from the web export of the app, at the size of an iPhone.

```bash
cd app && npm run data && npx expo export -p web --output-dir dist && cd ..
# Serve app/dist with a fallback to index.html, on port 18190.
node store/screenshots/capture.cjs store/screenshots/raw      # needs playwright
node store/screenshots/compose.cjs store/screenshots/config.json store/screenshots   # needs sharp
```

`compose.cjs` needs the fonts Inter and Source Serif 4. `config.json` holds the colours, the
headlines and the order of the screens. The colours are the blue of the cloth binding of the
printed book.
