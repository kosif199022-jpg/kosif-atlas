#!/usr/bin/env swift
// Renders app icons side by side, as Finder and the Dock would, into one PNG contact sheet.
// Usage: swift preview-icons.swift out.png [--dark] <app or file> [<app or file> …]
// Put the built app next to a few system apps (Finder, Safari, Notes…) to judge size, weight and
// style, and run it once with --dark. It reads icons through NSWorkspace, so it shows what macOS
// actually renders from the compiled Assets.car (or the .icns fallback), not the source layers.
import AppKit

var args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 2 else {
    print("usage: preview-icons.swift out.png [--dark] <path> [<path> …]")
    exit(64)
}
let out = URL(fileURLWithPath: args.removeFirst())
let dark = args.first == "--dark"
if dark { args.removeFirst() }

let sizes: [CGFloat] = [256, 128, 64, 32, 16]
let pad: CGFloat = 24
let columnWidth = sizes[0] + pad
let width = pad + CGFloat(args.count) * columnWidth
let height = pad + sizes.reduce(0) { $0 + $1 + pad }

let appearance = NSAppearance(named: dark ? .darkAqua : .aqua)!
let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: Int(width), pixelsHigh: Int(height), bitsPerSample: 8,
    samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
    bytesPerRow: 0, bitsPerPixel: 0
)!
appearance.performAsCurrentDrawingAppearance {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    (dark ? NSColor(white: 0.12, alpha: 1) : NSColor(white: 0.93, alpha: 1)).setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
    for (column, path) in args.enumerated() {
        // NSWorkspace needs an absolute path; a missing file silently renders as a blank document.
        let absolute = URL(fileURLWithPath: (path as NSString).expandingTildeInPath).standardizedFileURL.path
        guard FileManager.default.fileExists(atPath: absolute) else {
            print("No such file: \(absolute)")
            exit(66)
        }
        let icon = NSWorkspace.shared.icon(forFile: absolute)
        var y = height - pad
        for side in sizes {
            y -= side
            let x = pad + CGFloat(column) * columnWidth + (sizes[0] - side) / 2
            icon.draw(in: NSRect(x: x, y: y, width: side, height: side))
            y -= pad
        }
    }
    NSGraphicsContext.restoreGraphicsState()
}
try rep.representation(using: .png, properties: [:])!.write(to: out)
print("Wrote \(out.path) (\(args.count) icons, \(dark ? "dark" : "light"))")
