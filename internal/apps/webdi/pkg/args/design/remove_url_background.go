package design

import "strings"

func (bgSlice CssBgSlice) RemoveURLBackground_sub(defoColor string) string {
	var cleanParts []string

	for _, part := range bgSlice {
		trimmed := strings.TrimSpace(string(part))

		// url( が含まれていないパーツ（単色やグラデーションなど）だけを対象にする
		if strings.Contains(trimmed, "url(") {
			continue
		}
		// スペースやカンマ、括弧などで単語ごとに分解して処理する
		words := strings.FieldsFunc(trimmed, func(r rune) bool {
			return r == ' ' || r == ',' || r == '(' || r == ')'
		})

		cleanedTrimmed := trimmed
		for _, word := range words {
			// `#` から始まるカラーコードの場合の処理
			if !strings.HasPrefix(word, "#") {
				continue
			}
			var fixedHex string
			if len(word) == 9 {
				// #RRGGBBAA (9文字) -> #RRGGBB (最初の7文字)
				fixedHex = word[:7]
			} else if len(word) == 5 {
				// #RGBA (5文字) -> #RGB (最初の4文字)
				fixedHex = word[:4]
			}

			if fixedHex != "" {
				// 該当のカラーコードをアルファなしのものに置換
				cleanedTrimmed = strings.ReplaceAll(cleanedTrimmed, word, fixedHex)
			}
		}

		cleanParts = append(cleanParts, cleanedTrimmed)
	}

	result := strings.Join(cleanParts, ", ")

	if result == "" {
		return defoColor
	}

	return result
}

// background 文字列から url() が含まれるレイヤーを取り除く関数
func (bgSlice CssBgSlice) RemoveURLBackground(defoColor string) string {
	// カンマでレイヤーごとに分割
	var cleanParts []string

	for _, part := range bgSlice {
		trimmed := strings.TrimSpace(string(part))
		// url( が含まれていないパーツ（単色やグラデーションなど）だけを残す
		if !strings.Contains(trimmed, "url(") {
			cleanParts = append(cleanParts, trimmed)
		}
	}

	// 残ったパーツを再度カンマで結合
	result := strings.Join(cleanParts, ", ")

	// もし画像しか指定されておらず何も残らなかった場合は、リサイズ中用の真っ白(#ffffff)を返す
	if result == "" {
		return defoColor
	}

	return result
}
