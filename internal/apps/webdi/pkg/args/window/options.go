package window

import "github.com/puutaro/webdi/internal/apps/webdi/pkg/args/text"

type WindowOptions struct {
	Title        string          `arg:"--title" help:"window title string"`
	Text         text.Base64Text `arg:"--text" help:"description message (reco 'base64://' prefix about multiple line)"`
	WindowIcon   string          `arg:"--window-icon" default:"" help:"window ion"`
	Width        int             `arg:"--width" default:"1024" help:"Window width"`
	Height       int             `arg:"--height" default:"768" help:"Window height"`
	X            *int            `arg:"--x" help:"Window X position"`
	Y            *int            `arg:"--y" help:"Window Y position"`
	Center       bool            `arg:"--center" help:"Window center position"`
	Scroll       bool            `arg:"--scroll" help:"yad comp stub"`
	Hidden       bool            `arg:"--hidden" help:"hidden window"`
	Keep         bool            `arg:"--keep" help:"keep window disply even if press enter, escape"`
	KeepExcludes string          `arg:"--keep-excludes" help:"keep exclude:ex esc,ok,cance"`
}
