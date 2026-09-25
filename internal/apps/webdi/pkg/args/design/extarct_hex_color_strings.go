package design

import "strconv"

func extractFirstHexColor(s string, defoColor string) string {
	hexColorList := extractHexColors(s)
	if len(hexColorList) > 0 {
		return hexColorList[0]
	}
	return defoColor
}

func extractHexColors(s string) []string {
	var results []string
	n := len(s)

	for i := 0; i < n; i++ {
		// '#' が見つかった場合
		if s[i] == '#' {
			// '#' の次から有効なHEX文字（0-9, a-f, A-F）が何文字続くか数える
			length := 0
			for j := i + 1; j < n; j++ {
				c := s[j]
				if !isHex(c) {
					break
				}
				length++
			}

			// 長さが 3, 6, 8 のいずれかであればHEXコードとみなす
			if length == 3 || length == 6 || length == 8 {
				hexCode := s[i : i+1+length]
				results = append(results, hexCode)
				// 読み進めた分だけインデックスを進める
				i += length
			}
		}
	}

	return results
}

func filterByTransparency(colors []string, thresholdHex string) []string {
	// 閾値を10進数に変換（例: "f0" -> 240）
	threshold, err := strconv.ParseUint(thresholdHex, 16, 64)
	if err != nil {
		threshold = 0xf0 // パース失敗時のデフォルト
	}

	var filtered []string

	for _, c := range colors {
		hex := c
		if len(hex) > 0 && hex[0] == '#' {
			hex = hex[1:]
		}

		// デフォルトのアルファ値（3桁・6桁は完全不透明 = 255）
		alpha := uint64(255)

		if len(hex) == 8 {
			// 8桁（#RRGGBBAA）の場合、最後の2文字がアルファ値
			if aVal, err := strconv.ParseUint(hex[6:8], 16, 64); err == nil {
				alpha = aVal
			}
		}

		// 判定:
		// アルファ値は 00(完全透明) 〜 ff(完全不透明) です。
		// 「透明度が f0 より高い（＝より透明なもの）」を排除する場合、
		// アルファ値が閾値（240）未満のものを除外します。
		// ※もし「数値として f0 より大きいものを排除したい」場合は比較演算子を反転させてください。
		if alpha >= threshold {
			filtered = append(filtered, c)
		}
	}

	return filtered
}
func hexToRGBA(hex string) (uint8, uint8, uint8, float64) {
	// 先頭の '#' を除去
	if len(hex) > 0 && hex[0] == '#' {
		hex = hex[1:]
	}

	var r, g, b uint64 = 0, 0, 0
	var a float64 = 1.0 // デフォルトは完全不透明

	switch len(hex) {
	case 3:
		// 3桁 (#rgb) の場合、各文字を2回繰り返して6桁に拡張
		rHex := string([]byte{hex[0], hex[0]})
		gHex := string([]byte{hex[1], hex[1]})
		bHex := string([]byte{hex[2], hex[2]})
		r, _ = strconv.ParseUint(rHex, 16, 64)
		g, _ = strconv.ParseUint(gHex, 16, 64)
		b, _ = strconv.ParseUint(bHex, 16, 64)

	case 6:
		// 6桁 (#rrggbb) の場合
		r, _ = strconv.ParseUint(hex[0:2], 16, 64)
		g, _ = strconv.ParseUint(hex[2:4], 16, 64)
		b, _ = strconv.ParseUint(hex[4:6], 16, 64)

	case 8:
		// 8桁 (#rrggbbaa) の場合
		r, _ = strconv.ParseUint(hex[0:2], 16, 64)
		g, _ = strconv.ParseUint(hex[2:4], 16, 64)
		b, _ = strconv.ParseUint(hex[4:6], 16, 64)
		if aVal, err := strconv.ParseUint(hex[6:8], 16, 64); err == nil {
			// アルファ値（0〜255）を 0.0〜1.0 の浮動小数点数に変換
			a = float64(aVal) / 255.0
		}
	}

	// CSSの rgba(R, G, B, A) 形式で返す
	return uint8(r), uint8(g), uint8(b), a
}
