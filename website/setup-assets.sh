#!/bin/bash
# Copy template assets to website public directory
TEMPLATE="/Users/darshjme/projects/mycryptocoin/landing-reference/Cryto - Bitcoin & Cryptocurrency Landing Page HTML Template/main-file/cryto"
DEST="/Users/darshjme/projects/mycryptocoin/website/public"

# Create directories
mkdir -p "$DEST/images/icon" "$DEST/images/home" "$DEST/images/shape" "$DEST/images/logo" "$DEST/images/fav-icon" "$DEST/fonts"

# Copy images
cp "$TEMPLATE/images/icon/"* "$DEST/images/icon/" 2>/dev/null
cp "$TEMPLATE/images/home/"* "$DEST/images/home/" 2>/dev/null
cp "$TEMPLATE/images/shape/"* "$DEST/images/shape/" 2>/dev/null
cp "$TEMPLATE/images/logo/"* "$DEST/images/logo/" 2>/dev/null
cp "$TEMPLATE/images/fav-icon/"* "$DEST/images/fav-icon/" 2>/dev/null
cp "$TEMPLATE/images/1.gif" "$DEST/images/" 2>/dev/null

# Copy fonts
cp -R "$TEMPLATE/fonts/"* "$DEST/fonts/" 2>/dev/null

echo "Assets copied successfully!"
echo "Icon files: $(ls "$DEST/images/icon/" | wc -l)"
echo "Home files: $(ls "$DEST/images/home/" | wc -l)"
echo "Shape files: $(ls "$DEST/images/shape/" | wc -l)"
echo "Logo files: $(ls "$DEST/images/logo/" | wc -l)"
