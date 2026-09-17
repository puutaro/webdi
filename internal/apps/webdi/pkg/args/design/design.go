package design

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/libs/colortool"
)

type Design struct {
	Borders       int             `arg:"--borders" default:"10" help:"padding for component"`
	FontSize      int             `arg:"--font-size" default:"10" help:"font size"`
	FontColorCode FontColor       `arg:"--font-color" default:"#0f413d" help:"font color:colo code or hex string"`
	FontFamily    FontFamilySlice `arg:"--font-family,separate" help:"font family"`
}
type DesignConfig struct {
	Borders       int    `json:"borders"`
	FontSize      int    `json:"fontSize"`
	FontColor     string `json:"fontColor"`
	FontFamilyStr string `json:"fontFamily"`
}

type FontColor string

func (b *FontColor) UnmarshalText(text []byte) error {
	if len(text) == 0 {
		*b = FontColor("")
		return nil
	}
	str := string(bytes.TrimSpace(text))
	hexColorPrefix := "#"
	if strings.HasPrefix(str, hexColorPrefix) {
		hexColorStr, err := colortool.ValidateHexColor(str)
		if err != nil {
			return fmt.Errorf("failure to validate hex color: %s", str)
		}
		*b = FontColor(hexColorStr)
		return nil
	}
	hexColorStr, err := colortool.GetHexColor(str)
	if err != nil {
		return fmt.Errorf("failure to get hex color: %s", str)
	}
	*b = FontColor(hexColorStr)
	return nil
}

func (b FontColor) String() string {
	return string(b)
}

type FontFamily string

func (f *FontFamily) UnmarshalText(text []byte) error {
	str := string(bytes.TrimSpace(text))
	// 例: 空文字のチェックや、特定のフォーマット検証・加工を行う場合
	if len(str) == 0 {
		return fmt.Errorf("font family cannot be empty")
	}
	*f = FontFamily(str)
	return nil
}

type FontFamilySlice []FontFamily

func (fs FontFamilySlice) ConcatAndCompFontFamily() string {
	const defaultFontFamily = `ui-monospace, SFMono-Regular, ` +
		`Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
	if len(fs) == 0 {
		return defaultFontFamily
	}
	fontFamilyList := make([]string, len(fs))
	for i, fontFamily := range fs {
		fontFamilyList[i] = fmt.Sprintf(`"%s"`, strings.TrimSpace(string(fontFamily)))
	}
	return strings.Join(fontFamilyList, ", ") + `, ` + defaultFontFamily
}
