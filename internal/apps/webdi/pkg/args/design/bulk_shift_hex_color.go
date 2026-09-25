package design

func replaceToShiftHexColorsInStr(input string, step int) string {
	var result []byte
	i := 0
	n := len(input)

	for i < n {
		if input[i] != '#' {
			// Hexカラーでなければ通常の文字として追加
			result = append(result, input[i])
			i++
			continue
		}
		// '#' が見つかった場合、後ろに続くHexカラーの可能性をチェック
		// # の直後から有効なHex文字（0-9, a-f, A-F）が何文字続くか調べる
		start := i + 1
		end := start
		for end < n {
			c := input[end]
			if !isHex(c) {
				break
			}
			end++
		}
		length := end - start
		// 長さが 3, 6, 8 のいずれかであればHexカラーとみなす
		switch {
		case length == 3 ||
			length == 6 ||
			length == 8:
			hexStr := input[i:end]
			shifted := shiftHexColorByStep(hexStr, step)
			if shifted == "" {
				break
			}
			result = append(result, shifted...)
			i = end
			continue
		}
		// Hexカラーでなければ通常の文字として追加
		result = append(result, input[i])
		i++
	}
	return string(result)
}
