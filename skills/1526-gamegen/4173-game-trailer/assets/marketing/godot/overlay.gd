extends CanvasLayer
## Trailer graphics drawn over the game: kinetic captions, name cards, soft flashes, fades, and the full-frame
## cards (studio sting, logo slam with end card). Everything is a pure function of the shot frame `t` (no
## tweens, no timers), so slow motion never slows the graphics and every render is identical.
## Timeline timings are in beats from the shot's in-point (4 beats = 1 bar).
##
## BRAND section: point it at the game's own fonts, palette and art so the trailer looks like the game.
## Keep this file free of game class_names unless the adapter needs them; constants are enough.

# --- BRAND -------------------------------------------------------------------------------------------------

const DISPLAY_FONT := ""  # e.g. "res://assets/fonts/Display-Bold.ttf"; empty = Godot's fallback font
const KEY_ART := ""  # blurred backdrop of the logo card; empty = solid INK
const TITLE_LOGO := ""  # the game's logo image; empty = TITLE drawn as text
const STUDIO_MARK := ""  # small square studio mark for the studio sting and end card; empty = text only
const TITLE := "GAME TITLE"
const STUDIO := "STUDIO"
const PRESENTS := "P R E S E N T S"
const TAGLINE := "A ONE-LINE GENRE PITCH"
const STATUS_LINE := "IN DEVELOPMENT  ·  MADE WITH GODOT"
const HANDLE := "@handle"
const INK := Color("101018")  # backgrounds, outlines, fades
const TEXT := Color("f6e7c8")  # caption text
const ACCENT := Color("ff3b4e")  # caption bar, card stripe
const HIGHLIGHT := Color("ffc94a")  # card titles, shockwave, status line
## Flash safety: peak full-screen flash opacity and minimum fade. Match the game's own limits.
const FLASH_MAX := 0.35
const FLASH_FADE_FRAMES := 12.0
## The overlay draws in its own design space whose short side is this many units (1280x720 landscape,
## 720x1280 portrait), scaled to the frame, so sizes below hold whatever the game's base resolution is.
const DESIGN_SHORT_SIDE := 720.0

# --- state -----------------------------------------------------------------------------------------------

var portrait := false
var beat_frames := 24.0  # set by the director from the timeline's bpm and fps
var fx: Array = []
var card := ""
var t := 0
var slam_at := 0.0  # logo card: frames of backdrop before the logo slams in
var canvas: Control
var _textures := {}
var _font: Font


func _init() -> void:
	layer = 120
	canvas = Control.new()
	canvas.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	canvas.draw.connect(_draw_all)
	add_child(canvas)
	_font = load(DISPLAY_FONT) if DISPLAY_FONT != "" and ResourceLoader.exists(DISPLAY_FONT) else ThemeDB.fallback_font


func start_shot(s: Dictionary) -> void:
	fx = s.get("fx", [])
	t = 0
	_layout()
	canvas.queue_redraw()


func start_card(s: Dictionary) -> void:
	card = s.get("card", "")
	fx = s.get("fx", [])
	slam_at = _beats(s.get("slam", 0))
	t = 0
	_layout()
	canvas.queue_redraw()


func tick(frame: int) -> void:
	t = frame
	_layout()
	canvas.queue_redraw()


## Maps the design space onto the visible area of the game's viewport (after stretch and content scale).
func _layout() -> void:
	var vis := get_viewport().get_visible_rect().size
	var k := minf(vis.x, vis.y) / DESIGN_SHORT_SIDE
	transform = Transform2D(0.0, Vector2(k, k), 0.0, Vector2.ZERO)
	canvas.position = Vector2.ZERO
	canvas.size = vis / k


func _size() -> Vector2:
	return canvas.size


func _beats(b: Variant) -> float:
	return float(b) * beat_frames


# --- drawing ---------------------------------------------------------------------------------------------


func _draw_all() -> void:
	if card != "":
		canvas.draw_rect(Rect2(Vector2.ZERO, _size()), INK)
	match card:
		"studio":
			_draw_studio()
		"logo":
			_draw_logo_card()
	for e: Dictionary in fx:
		var age := t - _beats(e.get("at", 0))
		if age < 0:
			continue
		match e["type"]:
			"caption":
				_draw_caption(e, age)
			"label":
				_draw_label_card(e, age)
			"flash":
				_draw_flash(age, float(e.get("strength", 1.0)))
			"fade_in":
				_draw_fade(1.0 - clampf(age / _beats(e.get("len", 1)), 0.0, 1.0))
			"fade_out":
				_draw_fade(clampf(age / _beats(e.get("len", 1)), 0.0, 1.0))


## Largest size <= `size` at which `text` fits `max_w` (portrait frames are narrow).
func _fit(text: String, size: int, max_w: float) -> int:
	var w := _font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	return size if w <= max_w else maxi(12, int(size * max_w / w))


func _text_centered(text: String, center: Vector2, size: int, color: Color, outline := 0, outline_color := INK) -> void:
	var w := _font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var pos := center + Vector2(-w / 2.0, size * 0.35)
	if outline > 0:
		canvas.draw_string_outline(_font, pos, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, outline, outline_color)
	canvas.draw_string(_font, pos, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


## Kinetic caption: slams in (scale 1.7 -> 1 with overshoot), a slanted bar wipes in behind it, holds, then
## slides out fast just before its end. Keys: text, at, len (beats), y (0..1), size, color, bar.
func _draw_caption(e: Dictionary, age: float) -> void:
	var dur := _beats(e.get("len", 3.5))
	if age > dur:
		return
	var s := _size()
	var text: String = e["text"]
	var size := _fit(text, int(e.get("size", 120 if portrait else 132)), s.x * 0.8)
	var center := Vector2(s.x / 2.0, s.y * float(e.get("y", 0.5)))
	var k := lerpf(1.7, 1.0, _ease_out_back(clampf(age / 7.0, 0.0, 1.0)))
	var out := clampf((age - (dur - 6.0)) / 6.0, 0.0, 1.0)
	var alpha := clampf(age / 3.0, 0.0, 1.0) * (1.0 - out)
	var w := _font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var bw := (w + 120.0) * _ease_out(clampf((age - 2.0) / 6.0, 0.0, 1.0))
	var bh := size * 0.78
	var x0 := center.x - (w + 120.0) / 2.0 + out * s.x * 0.6
	var y0 := center.y - bh / 2.0 + size * 0.05
	var sl := bh * 0.35
	var col := Color(e.get("bar", ACCENT.to_html()))
	col.a = alpha * 0.92
	canvas.draw_colored_polygon(PackedVector2Array([Vector2(x0 + sl, y0), Vector2(x0 + bw + sl, y0),
		Vector2(x0 + bw, y0 + bh), Vector2(x0, y0 + bh)]), col)
	canvas.draw_set_transform(center + Vector2(out * s.x * 0.6, 0), -0.06, Vector2(k, k))
	var c := Color(e.get("color", TEXT.to_html()))
	c.a = alpha
	_text_centered(text, Vector2.ZERO, size, c, maxi(4, size / 6), Color(INK, alpha))
	canvas.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


## Name card (stage, world, boss, feature): slanted panel sliding in from the left with a title and sub-line.
## Copy the style of the game's own in-game cards. Keys: title, sub, at, len, y (0..1).
func _draw_label_card(e: Dictionary, age: float) -> void:
	var dur := _beats(e.get("len", 3.75))
	if age > dur:
		return
	var s := _size()
	var inn := _ease_out_back(clampf(age / 9.0, 0.0, 1.0))
	var out := _ease_in(clampf((age - (dur - 7.0)) / 7.0, 0.0, 1.0))
	var pw := minf(640.0, s.x - 100.0)  # keep clear of the right edge: portrait UIs put buttons there
	var ph := 170.0
	var x := lerpf(-pw - 60.0, 40.0, inn) - out * (pw + 120.0)
	var y := s.y * float(e.get("y", 0.62 if portrait else 0.1))
	var sl := 40.0
	canvas.draw_colored_polygon(PackedVector2Array([Vector2(x + sl, y), Vector2(x + pw + sl, y),
		Vector2(x + pw, y + ph), Vector2(x, y + ph)]), Color(INK, 0.9))
	canvas.draw_colored_polygon(PackedVector2Array([Vector2(x + pw + sl - 6, y), Vector2(x + pw + sl + 10, y),
		Vector2(x + pw + 10, y + ph), Vector2(x + pw - 6, y + ph)]), ACCENT)
	var title: String = e.get("title", "")
	var fs := _fit(title, 54, pw - 60.0)
	canvas.draw_string_outline(_font, Vector2(x + 36, y + 70), title, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 10, INK)
	canvas.draw_string(_font, Vector2(x + 36, y + 70), title, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, HIGHLIGHT)
	var sub: String = e.get("sub", "")
	canvas.draw_string(_font, Vector2(x + 36, y + 136), sub, HORIZONTAL_ALIGNMENT_LEFT, -1, _fit(sub, 46, pw - 60.0), TEXT)


## Soft full-screen flash within the flash-safety limits: 2-frame rise, FLASH_FADE_FRAMES fall.
func _draw_flash(age: float, strength: float) -> void:
	var a := clampf(age / 2.0, 0.0, 1.0) if age < 2.0 else 1.0 - clampf((age - 2.0) / FLASH_FADE_FRAMES, 0.0, 1.0)
	a *= FLASH_MAX * clampf(strength, 0.0, 1.0)
	if a > 0.0:
		canvas.draw_rect(Rect2(Vector2.ZERO, _size()), Color(1.0, 0.97, 0.9, a))


func _draw_fade(a: float) -> void:
	if a > 0.0:
		canvas.draw_rect(Rect2(Vector2.ZERO, _size()), Color(INK, a))


# --- full-frame cards ------------------------------------------------------------------------------------


## Studio sting: the mark grows in, then the studio name and "presents". Replace with the studio's own
## animated logo node if it has one (add it as a child in start_card and drive it from tick()).
func _draw_studio() -> void:
	var s := _size()
	var grow := _ease_out(clampf(t / (beat_frames * 3.0), 0.0, 1.0))
	var cy := s.y * 0.5
	if STUDIO_MARK != "":
		var mark := _tex(STUDIO_MARK)
		var ms := (300.0 if portrait else 340.0) * lerpf(0.85, 1.0, grow)
		canvas.draw_texture_rect(mark, Rect2(Vector2(s.x / 2.0 - ms / 2.0, cy - ms * 0.7), Vector2(ms, ms)), false,
			Color(1, 1, 1, grow))
		cy += ms * 0.45
	var a := clampf((t - beat_frames * 2.5) / 10.0, 0.0, 1.0)
	_text_centered(STUDIO, Vector2(s.x / 2.0, cy), _fit(STUDIO, 72, s.x * 0.8), Color(TEXT, a))
	var b := clampf((t - beat_frames * 3.5) / 10.0, 0.0, 1.0)
	_text_centered(PRESENTS, Vector2(s.x / 2.0, cy + 60.0), 22, Color(HIGHLIGHT, b))


func _tex(path: String, blurred := false) -> Texture2D:
	var key := path + str(blurred)
	if not _textures.has(key):
		var img: Image = (load(path) as Texture2D).get_image()
		if img.is_compressed():
			img.decompress()
		if blurred:
			var w := img.get_width()
			var h := img.get_height()
			# Soft blur: step down (each halving averages) then back up with cubic filtering.
			for k in [2, 4, 8, 16, 32]:
				img.resize(maxi(1, w / k), maxi(1, h / k), Image.INTERPOLATE_BILINEAR)
			img.resize(w / 4, h / 4, Image.INTERPOLATE_CUBIC)
		else:
			img.generate_mipmaps()
		_textures[key] = ImageTexture.create_from_image(img)
	return _textures[key]


## Logo slam over the blurred key art (shockwave and spark burst), then the end card lines:
## tagline, status ("in development"), studio mark and handle. Ends the trailer; hold it >= 1.5 bars.
func _draw_logo_card() -> void:
	var s := _size()
	var lt := float(t) - slam_at  # logo time: 0 at the slam
	if KEY_ART != "":
		var bg := _tex(KEY_ART, true)
		var cover := maxf(s.x / bg.get_width(), s.y / bg.get_height()) * (1.08 - 0.04 * clampf(float(t) / (beat_frames * 8.0), 0.0, 1.0))
		var bs := bg.get_size() * cover
		canvas.draw_texture_rect(bg, Rect2((s - bs) / 2.0, bs), false, Color(0.55, 0.5, 0.6))
		canvas.draw_rect(Rect2(Vector2.ZERO, s), Color(INK, 0.35))
	if lt < 0.0:
		return
	var lc := Vector2(s.x / 2.0, s.y * (0.36 if portrait else 0.4))
	var k := lerpf(2.4, 1.0, _ease_out_back(clampf(lt / 8.0, 0.0, 1.0))) * (1.0 + 0.012 * sin(lt * 0.08))
	if lt < 40.0:
		var fade := 1.0 - lt / 40.0
		canvas.draw_arc(lc, 60.0 + lt * 26.0, 0.0, TAU, 96, Color(HIGHLIGHT, 0.8 * fade), 10.0 * fade + 1.0, true)
		var rng := RandomNumberGenerator.new()
		rng.seed = 7
		for i in 28:
			var ang := rng.randf() * TAU
			var sp := rng.randf_range(14.0, 30.0)
			canvas.draw_line(lc + Vector2.from_angle(ang) * (40.0 + lt * sp * 0.7),
				lc + Vector2.from_angle(ang) * (40.0 + lt * sp), Color(HIGHLIGHT, fade), 4.0, true)
	var lh := 0.0
	canvas.draw_set_transform(lc, 0.0, Vector2(k, k))
	if TITLE_LOGO != "":
		var logo := _tex(TITLE_LOGO)
		var lw := minf(s.x * 0.86, 820.0)
		lh = lw * logo.get_height() / logo.get_width()
		canvas.draw_texture_rect(logo, Rect2(Vector2(-lw, -lh) / 2.0, Vector2(lw, lh)), false,
			Color(1, 1, 1, clampf(lt / 3.0, 0.0, 1.0)))
	else:
		var ts := _fit(TITLE, 150, s.x * 0.86)
		lh = ts * 1.2
		_text_centered(TITLE, Vector2.ZERO, ts, Color(TEXT, clampf(lt / 3.0, 0.0, 1.0)), 16)
	canvas.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
	var y := lc.y + lh / 2.0 + (70.0 if portrait else 40.0)
	var a1 := clampf((lt - beat_frames * 2.0) / 10.0, 0.0, 1.0)
	_text_centered(TAGLINE, Vector2(s.x / 2.0, y), _fit(TAGLINE, 34, s.x * 0.9), Color(TEXT, a1), 8, Color(INK, a1))
	var a2 := clampf((lt - beat_frames * 4.0) / 10.0, 0.0, 1.0)
	_text_centered(STATUS_LINE, Vector2(s.x / 2.0, y + 52.0), _fit(STATUS_LINE, 22, s.x * 0.9), Color(HIGHLIGHT, a2), 6,
		Color(INK, a2))
	# Studio mark and handle along the bottom, above the portrait UI zone.
	var by := s.y - (s.y * 0.2 if portrait else 66.0)
	var label := STUDIO + "   " + HANDLE
	var tw := _font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 24).x
	var ms := 54.0 if STUDIO_MARK != "" else 0.0
	var x0 := s.x / 2.0 - (ms + (14.0 if ms > 0.0 else 0.0) + tw) / 2.0
	if ms > 0.0:
		canvas.draw_texture_rect(_tex(STUDIO_MARK), Rect2(Vector2(x0, by - ms / 2.0), Vector2(ms, ms)), false, Color(1, 1, 1, a2))
		x0 += ms + 14.0
	canvas.draw_string_outline(_font, Vector2(x0, by + 9.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 24, 6, Color(INK, a2))
	canvas.draw_string(_font, Vector2(x0, by + 9.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 24, Color(TEXT, a2))


# --- easing ----------------------------------------------------------------------------------------------


static func _ease_out(x: float) -> float:
	return 1.0 - pow(1.0 - x, 3.0)


static func _ease_in(x: float) -> float:
	return x * x * x


static func _ease_out_back(x: float) -> float:
	var c1 := 1.70158
	var c3 := c1 + 1.0
	return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0)
