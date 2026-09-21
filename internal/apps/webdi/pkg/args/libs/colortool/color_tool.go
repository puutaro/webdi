package colortool

import "fmt"

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
