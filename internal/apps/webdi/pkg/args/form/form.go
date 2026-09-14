package form

import (
	"strconv"
	"strings"
	"unicode"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/buttons"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/design"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/gui"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/image"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/text"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/unique"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/window"
)

// フロントエンドへ渡すための1フィールド分の構造体
type FieldDef struct {
	Label        string   `json:"label"`
	Type         string   `json:"type"`         // CB, TXT, LBL など
	DefaultValue string   `json:"defaultValue"` // 初期値
	Items        []string `json:"items"`        // CBやCBEの選択肢（item-separatorで分割したもの）
	SrcValue     string   `json:"srcValue"`     // gen src value in frontend: ex NUM
}
type ButtonDef struct {
	Label    string `json:"label"`
	ExitCode int    `json:"exitCode"`
}

type FormCmd struct {
	ItemSeparator    string            `arg:"--item-separator" default:"!" help:"Separator for list items"`
	Separator        string            `arg:"--separator" default:"|" help:"Separator for output values"`
	DateFormat       string            `arg:"--date-format" default:"%Y:%m:%d" help:"Date format"`
	Fields           []text.Base64Text `arg:"--field,separate" help:"Define fields in the form (reco 'base64://' prefix about multiple line)"`
	FieldValues      []text.Base64Text `arg:"positional,separate" help:"field values (reco 'base64://' prefix about multiple line)"`
	SelectableLabels bool              `arg:"--selectable-labels" help:"stub for yad comp"`
	NoButtons        bool              `arg:"--no-buttons" help:"stub for yad comp"`
	design.Design
	window.WindowOptions
	buttons.ButtonOptions
	gui.GuiOptions
	unique.Unique
}

// レスポンス用の構造体を定義（これなら型安全！）
type FormConfigResponse struct {
	Id            string              `json:"id"`
	SubId         string              `json:"subId"`
	WindowIcon    string              `json:"windowIcon"`
	Title         string              `json:"title"`
	Text          string              `json:"text"`
	Design        design.DesignConfig `json:"design"`
	ItemSeparator string              `json:"itemSeparator"`
	Separator     string              `json:"separator"`
	Fields        []FieldDef          `json:"fields"`
	Buttons       []ButtonDef         `json:"buttons"`
}

func (cmd *FormCmd) GetFormConfig() FormConfigResponse {
	var parsedFields []FieldDef
	for index, raw := range cmd.Fields {
		fieldValues := cmd.FieldValues
		fValue := ""
		if index < len(fieldValues) {
			fValue = fieldValues[index].String(false)
		}
		parsed := parseFieldString(raw.String(true), fValue, cmd.ItemSeparator)
		parsedFields = append(parsedFields, parsed)
	}
	var parsedButtons []ButtonDef
	isButton := !cmd.NoButtons
	if isButton {
		for _, raw := range cmd.Buttons {
			parsed := parseButtonString(raw)
			parsedButtons = append(parsedButtons, parsed)
		}
	}
	if len(parsedButtons) == 0 && isButton {
		parsedButtons = append(
			parsedButtons,
			ButtonDef{
				Label:    "Ok",
				ExitCode: 0,
			},
		)
	}

	return FormConfigResponse{
		Id:         cmd.Id,
		SubId:      cmd.SubId,
		WindowIcon: image.ImageToBase64(cmd.WindowIcon),
		Title:      cmd.Title,
		Text:       text.TextUnescapeNewlinesTab(cmd.Text.String(false)),
		Design: design.DesignConfig{
			Borders:  cmd.Design.Borders,
			FontSize: cmd.Design.FontSize,
		},
		ItemSeparator: cmd.ItemSeparator,
		Separator:     cmd.Separator,
		Fields:        parsedFields,
		Buttons:       parsedButtons,
	}
}
func parseButtonString(raw string) ButtonDef {
	parts := strings.SplitN(raw, ":", 2)
	// yad comp gtk-ok etc.. button
	label, _ := strings.CutPrefix(parts[0], "gtk-")
	labelWithCapi := capitalizeFirst(label)
	exitCode := 0
	if len(parts) > 1 {
		val, err := strconv.Atoi(parts[1])
		if err != nil {
			val = 0
		}
		exitCode = val
	}
	return ButtonDef{
		Label:    labelWithCapi,
		ExitCode: exitCode,
	}
}

func capitalizeFirst(s string) string {
	if s == "" {
		return ""
	}
	// 文字列をルーン（Unicode文字）の配列に変換する（マルチバイト文字対応のため）
	runes := []rune(s)
	// 先頭の文字を大文字にする
	runes[0] = unicode.ToUpper(runes[0])
	// 再び文字列に戻す
	return string(runes)
}

// 文字列パースのヘルパー（簡易版）
func parseFieldString(raw, fValue, itemSep string) FieldDef {

	// 実際には yad の書式（--field="ラベル:タイプ" 初期値 のようなスペース区切りやイコール区切り）に合わせて堅牢にパースします
	label, fType := splitByLastColon(raw)
	if fType == "" {
		fType = "TXT" // デフォルト
	}
	formLabel := ""
	switch true {
	case
		fType == "LBL":
		formLabel = text.TextUnescapeNewlinesTab(
			decodeHtmlEntities(label),
		)
	default:
		formLabel = getFirstLine(label)
	}
	var srcValue string
	var items []string
	defaultValue := fValue
	switch true {
	case
		fType == "CB" ||
			fType == "CBE":
		items, defaultValue = makeItemsAndDefaultValueForCB(
			fValue,
			itemSep,
		)
	case fType == "NUM":
		defaultValue, _, _ = strings.Cut(fValue, "!")
		srcValue = fValue
	}
	return FieldDef{
		Label:        formLabel,
		Type:         fType,
		DefaultValue: defaultValue,
		Items:        items,
		SrcValue:     srcValue,
	}
}

func makeItemsAndDefaultValueForCB(
	fValue string,
	itemSep string,
) ([]string, string) {
	defaultPrefixSignal := "^"
	items := strings.Split(
		strings.ReplaceAll(
			fValue,
			defaultPrefixSignal,
			"",
		),
		itemSep,
	)
	rowItems := strings.Split(fValue, itemSep)
	defaultValue := items[0]
	for _, ritem := range rowItems {
		if !strings.HasPrefix(ritem, defaultPrefixSignal) {
			continue
		}
		defaultValue = strings.ReplaceAll(
			ritem,
			defaultPrefixSignal,
			"",
		)
		break
	}
	return items, defaultValue
}

func splitByLastColon(s string) (string, string) {
	idx := strings.LastIndex(s, ":")
	if idx == -1 {
		return s, ""
	}
	// 2. 最後の ":" の前後でスライスして切り分ける
	before := s[:idx]  // ":" より前
	after := s[idx+1:] // ":" より後ろ
	return before, after
}
func getFirstLine(s string) string {
	first, _, _ := strings.Cut(s, "\n")
	return first
}

func decodeHtmlEntities(text string) string {
	if text == "" {
		return ""
	}

	// 置換のペアを定義
	replacer := strings.NewReplacer(
		"&quot;", "\"",
		"&amp;", "&",
		"&lt;", "<",
		"&gt;", ">",
		"&apos;", "'",
		"&nbsp;", " ",
	)

	return replacer.Replace(text)
}
