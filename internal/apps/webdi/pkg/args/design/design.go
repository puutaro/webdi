package design

import (
	"bytes"
	"fmt"
	"os"
	"strings"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/libs/colortool"
)

type Design struct {
	Borders             int             `arg:"--borders" default:"10" help:"padding for component"`
	FontSize            int             `arg:"--font-size" default:"10" help:"font size"`
	FontColorCode       ColorCode       `arg:"--font-color" default:"#0f413d" help:"font color:color code or hex string"`
	FontFamily          FontFamilySlice `arg:"--font-family,separate" help:"font family"`
	FontStrokeWidth     float64         `arg:"--font-stroke-width" default:"0.15" help:"font stroke width by em"`
	FontStrokeColor     ColorCode       `arg:"--font-stroke-color" default:"#ffffff" help:"font stroke color:color code or hex string"`
	HeaderFontColorCode ColorCode       `arg:"--header-font-color" default:"#0d9488" help:"header font color:color code or hex string"`
	StateBackground     CssBgStr        `arg:"--state-bg" default:"#ccfbf1" help:"state background color:color code or hex string"`
	ReverseStageBg      bool            `arg:"--rev-state-bg" help:"reverse state background color order"`
	Background          CssBgSlice      `arg:"--background,separate" help:"background color or image: enable file prefix file://"`
}

type StateDesign struct {
	Minus100       string `json:"minus100"`
	Plus100        string `json:"plus100"`
	Plus200        string `json:"plus200"`
	Plus300        string `json:"plus300"`
	Plus400        string `json:"plus400"`
	SelectionColor string `json:"selectionColor"`
	FocusRingColor string `json:"focusRingColor"`
}
type DesignConfig struct {
	Borders          int         `json:"borders"`
	FontSize         int         `json:"fontSize"`
	FontColor        string      `json:"fontColor"`
	FontFamilyStr    string      `json:"fontFamily"`
	FontStrokeWidth  float64     `json:"fontStrokeWidth"`
	FontStrokeColor  string      `json:"fontStrokeColor"`
	HeaderFontColor  string      `json:"headerFontColor"`
	StateBg          StateDesign `json:"stateBgColor"`
	Background       string      `json:"background"`
	ResizeBackground string      `json:"resizeBg"`
	PocketBackground string      `json:"pocketBackground"`
}

const filePrefix = "file://"

type CssBgStr string
type CssBgSlice []CssBgStr

func (b *CssBgStr) UnmarshalText(text []byte) error {
	trimmedText := bytes.TrimSpace(text)
	if len(trimmedText) == 0 {
		return fmt.Errorf("background color cannot be empty")
	}
	// カラー名やHexの置換処理を通す
	srcCssBgStr := colortool.ReplaceColorNameFromByte(trimmedText)
	if len(srcCssBgStr) == 0 {
		return fmt.Errorf("background color cannot be empty")
	}
	str, err := readFilePrefix(srcCssBgStr)
	if err != nil {
		return fmt.Errorf("failure to read file prefix(%s): %s", filePrefix, err)
	}
	*b = CssBgStr(str)
	return nil
}
func (bs CssBgSlice) Concat() string {
	if len(bs) == 0 {
		const defaultBgColor = `#ffffff`
		return defaultBgColor
	}
	var bgList []string
	for _, bgEl := range bs {
		bgElStr := strings.TrimSpace(string(bgEl))
		if bgElStr == "" {
			continue
		}
		bgList = append(
			bgList,
			bgElStr,
		)
	}
	return strings.Join(bgList, ", ")
}
func readFilePrefix(line string) (string, error) {
	if !strings.HasPrefix(
		strings.TrimSpace(line),
		filePrefix,
	) {
		return line, nil
	}
	body, _ := strings.CutPrefix(line, filePrefix)
	byte, err := os.ReadFile(body)
	if err != nil {
		return "", err
	}
	return string(byte), nil
}
func (bs CssBgSlice) PocketColor() string {
	const defaultBgColor = `#ffffff`
	if len(bs) == 0 {
		return defaultBgColor
	}
	var bgList []string
	for _, bgEl := range bs {
		bgElStr := fmt.Sprintf(`%s`, strings.TrimSpace(string(bgEl)))
		if !strings.Contains(bgElStr, "-gradient") {
			continue
		}
		bgList = append(bgList, bgElStr)
	}
	if len(bgList) == 0 {
		return defaultBgColor
	}
	return bgList[len(bgList)-1]
}
func (bs CssBgSlice) GetWallColor() (uint8, uint8, uint8, float64) {
	if len(bs) == 0 {
		return 255, 255, 255, 1
	}
	var bgList []string
	for _, bgEl := range bs {
		bgElStr := fmt.Sprintf(`%s`, strings.TrimSpace(string(bgEl)))
		if !strings.Contains(bgElStr, "-gradient") {
			continue
		}
		bgList = append(bgList, bgElStr)
	}
	if len(bgList) == 0 {
		return 255, 255, 255, 1
	}
	lastGradientStr := bgList[len(bgList)-1]
	hexList := filterByTransparency(
		extractHexColors(lastGradientStr),
		"F0",
	)
	if len(hexList) == 0 {
		return 255, 255, 255, 1
	}
	return hexToRGBA(
		hexList[len(hexList)-1],
	)
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

func (c CssBgStr) MakeStateBgColor(revStateBgOrder bool) StateDesign {
	cStr := string(c)
	if revStateBgOrder {
		selectionColor := extractFirstHexColor(cStr, "#ebfff9")
		minus400 := replaceToShiftHexColorsInStr(cStr, -300)
		focusRingColor := extractFirstHexColor(minus400, "#ffffff")
		return StateDesign{
			Minus100:       replaceToShiftHexColorsInStr(cStr, 100),
			Plus100:        cStr,
			Plus200:        replaceToShiftHexColorsInStr(cStr, -100),
			Plus300:        replaceToShiftHexColorsInStr(cStr, -200),
			Plus400:        replaceToShiftHexColorsInStr(cStr, -300),
			SelectionColor: selectionColor,
			FocusRingColor: focusRingColor,
		}
	}
	selectionColor := extractFirstHexColor(cStr, "#a7eadf")
	plus400 := replaceToShiftHexColorsInStr(cStr, 300)
	focusRingColor := extractFirstHexColor(plus400, "#5ec8b8")
	return StateDesign{
		Minus100:       replaceToShiftHexColorsInStr(cStr, -100),
		Plus100:        cStr,
		Plus200:        replaceToShiftHexColorsInStr(cStr, 100),
		Plus300:        replaceToShiftHexColorsInStr(cStr, 200),
		Plus400:        plus400,
		SelectionColor: selectionColor,
		FocusRingColor: focusRingColor,
	}
}
