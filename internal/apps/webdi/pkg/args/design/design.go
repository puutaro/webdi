package design

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/libs/colortool"
)

type Design struct {
	Borders                  int             `arg:"--borders" default:"10" help:"padding for component"`
	FontSize                 int             `arg:"--font-size" default:"10" help:"font size"`
	FontColorCode            ColorCode       `arg:"--font-color" default:"#0f413d" help:"font color:color code or hex string"`
	FontFamily               FontFamilySlice `arg:"--font-family,separate" help:"font family"`
	FontStrokeWidth          float64         `arg:"--font-stroke-width" default:"0.15" help:"font stroke width by em"`
	FontStrokeColor          ColorCode       `arg:"--font-stroke-color" default:"#ffffff" help:"font stroke color:color code or hex string"`
	HeaderFontColorCode      ColorCode       `arg:"--header-font-color" default:"#0d9488" help:"header font color:color code or hex string"`
	StateBackgroundColorCode ColorCode       `arg:"--state-bg-color" default:"#ccfbf1" help:"state background color:color code or hex string"`
	ReverseStageBgColor      bool            `arg:"--rev-state-bg-color" help:"reverse state background color order"`
	Background               BackgroundSlice `arg:"--background,separate" help:"background color or image"`
}

type StateBgColor struct {
	Minus100 string `json:"minus100"`
	Plus100  string `json:"plus100"`
	Plus200  string `json:"plus200"`
	Plus300  string `json:"plus300"`
	Plus400  string `json:"plus400"`
}
type DesignConfig struct {
	Borders          int          `json:"borders"`
	FontSize         int          `json:"fontSize"`
	FontColor        string       `json:"fontColor"`
	FontFamilyStr    string       `json:"fontFamily"`
	FontStrokeWidth  float64      `json:"fontStrokeWidth"`
	FontStrokeColor  string       `json:"fontStrokeColor"`
	HeaderFontColor  string       `json:"headerFontColor"`
	StateBgColor     StateBgColor `json:"stateBgColor"`
	Background       string       `json:"background"`
	PocketBackground string       `json:"pocketBackground"`
}

type BackgroundEl string
type BackgroundSlice []BackgroundEl

func (b *BackgroundEl) UnmarshalText(text []byte) error {
	str := string(bytes.TrimSpace(text))
	// 例: 空文字のチェックや、特定のフォーマット検証・加工を行う場合
	if len(str) == 0 {
		return fmt.Errorf("font family cannot be empty")
	}
	*b = BackgroundEl(str)
	return nil
}
func (bs BackgroundSlice) Concat() string {
	if len(bs) == 0 {
		const defaultBgColor = `#ffffff`
		return defaultBgColor
	}
	bgList := make([]string, len(bs))
	for i, bgEl := range bs {
		bgList[i] = fmt.Sprintf(`"%s"`, strings.TrimSpace(string(bgEl)))
	}
	return strings.Join(bgList, ", ")
}
func (bs BackgroundSlice) PocketColor() string {
	const defaultBgColor = `#ffffff`
	if len(bs) == 0 {
		return defaultBgColor
	}
	for _, bgEl := range bs {
		bgElStr := fmt.Sprintf(`"%s"`, strings.TrimSpace(string(bgEl)))
		if !strings.Contains(bgElStr, "-gradient") {
			continue
		}
		return bgElStr
	}
	return defaultBgColor
}

type ColorCode string

func (b *ColorCode) UnmarshalText(text []byte) error {
	if len(text) == 0 {
		*b = ColorCode("")
		return nil
	}
	str := string(bytes.TrimSpace(text))
	hexColorPrefix := "#"
	if strings.HasPrefix(str, hexColorPrefix) {
		hexColorStr, err := colortool.ValidateHexColor(str)
		if err != nil {
			return fmt.Errorf("failure to validate hex color: %s", str)
		}
		*b = ColorCode(hexColorStr)
		return nil
	}
	hexColorStr, err := colortool.GetHexColor(str)
	if err != nil {
		return fmt.Errorf("failure to get hex color: %s", str)
	}
	*b = ColorCode(hexColorStr)
	return nil
}

func (b ColorCode) String() string {
	return string(b)
}

type FontFamily string
type FontFamilySlice []FontFamily

func (f *FontFamily) UnmarshalText(text []byte) error {
	str := string(bytes.TrimSpace(text))
	// 例: 空文字のチェックや、特定のフォーマット検証・加工を行う場合
	if len(str) == 0 {
		return fmt.Errorf("font family cannot be empty")
	}
	*f = FontFamily(str)
	return nil
}

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

func (c ColorCode) MakeStateBgColor(revStateBgOrder bool) StateBgColor {
	cStr := string(c)
	if revStateBgOrder {
		return StateBgColor{
			Minus100: shiftHexColorByStep(cStr, 100),
			Plus100:  cStr,
			Plus200:  shiftHexColorByStep(cStr, -100),
			Plus300:  shiftHexColorByStep(cStr, -200),
			Plus400:  shiftHexColorByStep(cStr, -300),
		}
	}
	return StateBgColor{
		Minus100: shiftHexColorByStep(cStr, -100),
		Plus100:  cStr,
		Plus200:  shiftHexColorByStep(cStr, 100),
		Plus300:  shiftHexColorByStep(cStr, 200),
		Plus400:  shiftHexColorByStep(cStr, 300),
	}
}
