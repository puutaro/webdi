package design

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/libs/colortool"
)

type Design struct {
	Borders       int       `arg:"--borders" default:"10" help:"padding for component"`
	FontSize      int       `arg:"--font-size" default:"10" help:"font size"`
	FontColorCode TextColor `arg:"--font-color" default:"#0f413d" help:"font color:colo code or hex string"`
}
type DesignConfig struct {
	Borders   int    `json:"borders"`
	FontSize  int    `json:"fontSize"`
	FontColor string `json:"fontColor"`
}

type TextColor string

func (b *TextColor) UnmarshalText(text []byte) error {
	if len(text) == 0 {
		*b = TextColor("")
		return nil
	}
	str := string(bytes.TrimSpace(text))
	hexColorPrefix := "#"
	if strings.HasPrefix(str, hexColorPrefix) {
		hexColorStr, err := colortool.ValidateHexColor(str)
		if err != nil {
			return fmt.Errorf("failure to validate hex color: %s", str)
		}
		*b = TextColor(hexColorStr)
		return nil
	}
	hexColorStr, err := colortool.GetHexColor(str)
	if err != nil {
		return fmt.Errorf("failure to get hex color: %s", str)
	}
	*b = TextColor(hexColorStr)
	return nil
}

func (b TextColor) String() string {
	return string(b)
}
