package design

type Design struct {
	Borders  int `arg:"--borders" default:"10" help:"padding for component"`
	FontSize int `arg:"--font-size" default:"10" help:"font size"`
}
