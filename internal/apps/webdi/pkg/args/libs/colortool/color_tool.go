package colortool

import (
	"bytes"
	"fmt"
	"strings"
)

var colorMap = map[string]string{
	"lgreen": "#43fa46",
	"green":  "#11b812",
	"dgreen": "#014702",
	"lred":   "#fa4d4d",
	"red":    "#ff0000",
	"dred":   "#850101",
	"lblue":  "#26c0fc",
	"blue":   "#0026ff",
	"dblue":  "#001d9e",
	"lazure": "#67e8eb",
	"azure":  "#21ebc6",
	"dazure": "#1c4d44",
	"yellow": "#fff200",
	"lbrown": "#f26e27",
	"brown":  "#b35c15",
	"dbrown": "#572b07",
	"black":  "#000000",
	"white":  "#ffffff",
	"trans":  "#00000000",
}

func GetHexColor(colorCode string) (string, error) {
	hex := colorMap[colorCode]
	if hex == "" {
		return ValidateHexColor(colorCode)
	}
	return hex, nil
}
func ReplaceColorNameFromByte(srcLine []byte) string {
	if len(srcLine) == 0 {
		return ""
	}

	// 完全一致のチェック（[]byte を string に変換して map を引く）
	// ※変換コストを抑えたい場合は colorMap のキー側を string にしておきここで string(srcLine) を使えばOKです
	if hexStr, ok := colorMap[string(srcLine)]; ok {
		return hexStr
	}

	// 効率的な処理のため、最初は []byte のままコピーを保持
	line := make([]byte, len(srcLine))
	copy(line, srcLine)

	for name, hex := range colorMap {
		nameInSpace := fmt.Appendf(nil, " %s ", name)
		replaceInSpace := fmt.Appendf(nil, " %s ", hex)
		line = bytes.ReplaceAll(line, nameInSpace, replaceInSpace)

		nameSuffixSpace := fmt.Appendf(nil, "%s ", name)
		replaceSuffixSpace := fmt.Appendf(nil, "%s ", hex)
		if bytes.HasPrefix(line, nameSuffixSpace) {
			line = bytes.ReplaceAll(line, nameSuffixSpace, replaceSuffixSpace)
		}

		namePrefixSpace := fmt.Appendf(nil, " %s", name)
		replacePrefixSpace := fmt.Appendf(nil, " %s", hex)
		if bytes.HasSuffix(line, nameSuffixSpace) {
			line = bytes.ReplaceAll(line, namePrefixSpace, replacePrefixSpace)
		}
	}
	return string(line)
}
func ReplaceColorName(srcLine string) string {
	if srcLine == "" {
		return ""
	}
	if hexStr, ok := colorMap[srcLine]; ok {
		return hexStr
	}
	line := srcLine
	for name, hex := range colorMap {
		nameInSpace := fmt.Sprintf(" %s ", name)
		line = strings.ReplaceAll(line, nameInSpace, hex)
		nameSuffixSpace := fmt.Sprintf("%s ", name)
		line = strings.ReplaceAll(line, nameSuffixSpace, hex)
		namePrefixSpace := fmt.Sprintf(" %s", name)
		line = strings.ReplaceAll(line, namePrefixSpace, hex)
	}
	return line
}
func ValidateHexColor(color string) (string, error) {
	if len(color) == 0 {
		return "", fmt.Errorf("empty color string")
	}

	start := 0
	if color[0] == '#' {
		start = 1
	}

	// 長さは 3桁(#なし+3), 6桁(#なし+6), 8桁(#なし+8) のいずれか
	// （#がある場合はそれぞれ全体で 4, 7, 9文字になる）
	length := len(color) - start
	if length != 3 && length != 6 && length != 8 {
		return "", fmt.Errorf("invalid hex color length: %q", color)
	}

	// 1文字ずつバイト単位で高速チェック
	for i := start; i < len(color); i++ {
		c := color[i]
		isDigit := c >= '0' && c <= '9'
		isLower := c >= 'a' && c <= 'f'
		isUpper := c >= 'A' && c <= 'F'
		if !isDigit && !isLower && !isUpper {
			return "", fmt.Errorf("invalid hex color character %q in %q", c, color)
		}
	}

	return color, nil
}
