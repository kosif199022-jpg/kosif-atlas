# In-app icon tiles (SwiftUI)

Icons the app draws for its own content should look like small siblings of the app icon. This tile is drawn at runtime,
so it scales to any size and follows the app's colors without image assets.

```swift
/// Apple's icon corner: a continuous rounded rect at ~22.4% of the side.
func squircle(_ side: CGFloat) -> RoundedRectangle {
    RoundedRectangle(cornerRadius: side * 0.2237, style: .continuous)
}

/// Colored squircle with a glassy sheen, the base for symbol, emoji and letter icons.
struct TileBackground: View {
    let color: Color
    let side: CGFloat

    var body: some View {
        let shape = squircle(side)
        ZStack {
            // Body: the color, a little lighter at the top and darker at the bottom.
            shape.fill(LinearGradient(
                colors: [color.adjusted(brightness: 0.1, saturation: -0.05), color.adjusted(brightness: -0.12)],
                startPoint: .top, endPoint: .bottom
            ))
            // Sheen: white fading out by the middle, like light from above.
            shape.fill(LinearGradient(
                colors: [.white.opacity(0.28), .white.opacity(0.02), .clear],
                startPoint: .top, endPoint: .center
            ))
            // Edge: a thin top-lit border that separates the tile from dark backgrounds.
            shape.strokeBorder(
                LinearGradient(colors: [.white.opacity(0.5), .white.opacity(0.06)], startPoint: .top, endPoint: .bottom),
                lineWidth: max(0.75, side * 0.012)
            )
        }
        .frame(width: side, height: side)
        .shadow(color: .black.opacity(0.3), radius: side * 0.06, y: side * 0.035)
    }
}

struct SymbolTile: View {
    let symbol: String
    let color: Color
    let side: CGFloat

    var body: some View {
        TileBackground(color: color, side: side)
            .overlay {
                Image(systemName: symbol)
                    .font(.system(size: side * 0.44, weight: .semibold))
                    .foregroundStyle(.white)  // or black on light fills: pick by contrast
                    .shadow(color: .black.opacity(0.25), radius: side * 0.02, y: side * 0.01)
            }
    }
}
```

`Color.adjusted(brightness:saturation:)` is a small helper: convert to HSB through `NSColor(self)` and clamp. Write one
if the project lacks it.

## Rules that kept it consistent

- **Share the app icon's vocabulary.** Reuse its glyphs and colors for the matching in-app item (a launcher's default
  command tile is the icon's dark `>_` tile, in the same green on the same near-black).
- **Size like real icons.** Real app icons leave a margin inside their frame, so draw custom tiles at ~80% of the slot
  and center them. Otherwise they look larger than the app icons around them.
- **Glyph contrast.** Pick white or black glyphs by the fill's WCAG contrast (3:1 for large glyphs, 4.5:1 for text)
  rather than by hand, and unit test the choice if users pick colors.
- **Scale everything from `side`.** Corner radius, border, shadow and glyph size are fractions of the side, so the same
  view works for 18 pt title bars and 104 pt tiles.
- **Small sizes need less.** Below ~32 pt, drop text overlays (a label's name becomes a colored dot) and keep one glyph.
- **Keep real icons real.** Show an app's own icon (`NSWorkspace.shared.icon(forFile:)`) and a site's favicon as they
  are; only placeholders and custom items get tiles.
- **Accessibility.** A decorative tile next to a visible name is hidden from VoiceOver; a standalone tile gets an
  accessibility label naming what it stands for.
