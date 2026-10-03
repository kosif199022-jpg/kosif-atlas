#!/usr/bin/env swift
// Draws the layers of an Icon Composer icon (<name>.icon/Assets/*.png) on a 1024 pt canvas.
// Usage: swift make-icon.swift Resources/AppIcon.icon
// The .icon's icon.json (background fill, glass, shadow, dark appearance) lists these layers by
// file name. Edit it by hand or in Icon Composer; this script only rewrites Assets/.
//
// Template: replace the example layers (a card and a round badge) with the app's own motif.
import AppKit

let output = CommandLine.arguments.dropFirst().first ?? "Resources/AppIcon.icon"
let canvas: CGFloat = 1024

func color(_ hex: String, _ alpha: CGFloat = 1) -> NSColor {
    let v = UInt32(hex.dropFirst(), radix: 16)!
    return NSColor(srgbRed: CGFloat(v >> 16 & 0xFF) / 255, green: CGFloat(v >> 8 & 0xFF) / 255,
                   blue: CGFloat(v & 0xFF) / 255, alpha: alpha)
}

/// One layer on a transparent canvas. Draw flat shapes only: the system adds glass, highlights and shadows.
func layer(_ draw: () -> Void) -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: Int(canvas), pixelsHigh: Int(canvas), bitsPerSample: 8,
        samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
        bytesPerRow: 0, bitsPerPixel: 0
    )!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    draw()
    NSGraphicsContext.restoreGraphicsState()
    return rep
}

/// A rounded rect filled with a top-to-bottom gradient. AppKit's origin is bottom-left.
func roundedFill(_ r: NSRect, radius: CGFloat, _ top: String, _ bottom: String) {
    let path = NSBezierPath(roundedRect: r, xRadius: radius, yRadius: radius)
    NSGraphicsContext.saveGraphicsState()
    path.addClip()
    NSGradient(colors: [color(top), color(bottom)])!.draw(in: r, angle: -90)
    NSGraphicsContext.restoreGraphicsState()
}

/// Text centered in a rect, e.g. a glyph or monogram. Nudge `dy` by eye: fonts carry descender space.
func centered(_ text: String, in r: NSRect, font: NSFont, _ hex: String, dy: CGFloat = 0) {
    let s = NSAttributedString(string: text, attributes: [.font: font, .foregroundColor: color(hex)])
    let size = s.size()
    s.draw(at: NSPoint(x: r.midX - size.width / 2, y: r.midY - size.height / 2 + dy))
}

// Keep the artwork to the middle ~60% of the canvas so the glass and the system's margins have room.
let art = NSRect(x: canvas * 0.2, y: canvas * 0.2, width: canvas * 0.6, height: canvas * 0.6)

// Few layers (2–4) read best; each gets its own glass. icon.json lists them front to back:
// its first layer is drawn on top.
let layers: [(String, NSBitmapImageRep)] = [
    ("card", layer {
        let r = art.insetBy(dx: 0, dy: art.height * 0.12)
        roundedFill(r, radius: r.height * 0.18, "#F4F5FF", "#D9DCF5")
        // Simple content lines, so the card reads as a document/widget at small sizes.
        for (i, width) in [0.62, 0.44].enumerated() {
            let line = NSRect(x: r.minX + r.width * 0.12, y: r.maxY - r.height * (0.3 + 0.2 * CGFloat(i)),
                              width: r.width * width, height: r.height * 0.09)
            color("#5E5CE6").setFill()
            NSBezierPath(roundedRect: line, xRadius: line.height / 2, yRadius: line.height / 2).fill()
        }
    }),
    ("badge", layer {
        let d = art.width * 0.36
        let r = NSRect(x: art.maxX - d * 0.85, y: art.minY + d * 0.05, width: d, height: d)
        let path = NSBezierPath(ovalIn: r)
        NSGraphicsContext.saveGraphicsState()
        path.addClip()
        NSGradient(colors: [color("#FFB340"), color("#FF7A0A")])!.draw(in: r, angle: -90)
        NSGraphicsContext.restoreGraphicsState()
        centered("✓", in: r, font: .systemFont(ofSize: d * 0.5, weight: .heavy), "#FFFFFF", dy: d * 0.02)
    }),
]

let assets = URL(fileURLWithPath: output).appendingPathComponent("Assets")
try? FileManager.default.removeItem(at: assets)
try FileManager.default.createDirectory(at: assets, withIntermediateDirectories: true)
for (name, rep) in layers {
    try rep.representation(using: .png, properties: [:])!.write(to: assets.appendingPathComponent("\(name).png"))
}
print("Wrote \(layers.count) layers to \(assets.path)")
