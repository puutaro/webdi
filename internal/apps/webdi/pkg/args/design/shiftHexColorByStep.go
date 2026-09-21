package design

import (
	"fmt"
	"image/color"
	"os"
	"strconv"
)

// ShiftHexColorByStep は、指定したHexカラーに対し、
// Tailwindのステップ（例: +100 ごとに明度を下げて暗くする）に応じて暗いHexカラーを返す関数
// step: 100, 200, 300 など（100あたり約 0.07 ほど明度を下げる調整例）
func shiftHexColorByStep(hexStr string, step int) string {
	rgba, err := parseHexColor(hexStr)
	if err != nil {
		os.Stderr.WriteString(fmt.Sprintf("Error parsing hex color: %v\n", err))
		return ""
	}

	h, s, l := rgbToHSL(rgba.R, rgba.G, rgba.B)

	// 100ステップにつきどれくらい暗く（明度を下げる）するか係数を設定
	// 例: 100刻みごとに明度を 0.065 (約6.5%) ずつ引いていく
	factor := float64(step / 100)
	l -= factor * 0.065

	// 0.0〜1.0の範囲に収める（真っ黒になりすぎないよう下限も考慮）
	if l < 0.05 {
		l = 0.05
	}
	if l > 1 {
		l = 1
	}

	newRGBA := hslToRGB(h, s, l)
	return rgbaToHex(newRGBA)
}

// Hexをパースしてcolor.RGBAに変換するヘルパー
func parseHexColor(s string) (color.RGBA, error) {
	if len(s) > 0 && s[0] == '#' {
		s = s[1:]
	}
	if len(s) != 6 {
		return color.RGBA{}, fmt.Errorf("invalid hex length")
	}
	rgb, err := strconv.ParseUint(s, 16, 32)
	if err != nil {
		return color.RGBA{}, err
	}
	return color.RGBA{
		R: uint8(rgb >> 16),
		G: uint8((rgb >> 8) & 0xFF),
		B: uint8(rgb & 0xFF),
		A: 255,
	}, nil
}

// RGBAをHex文字列に戻すヘルパー
func rgbaToHex(c color.RGBA) string {
	return fmt.Sprintf("#%02x%02x%02x", c.R, c.G, c.B)
}

// RGBをHSLに変換する簡易関数
func rgbToHSL(r, g, b uint8) (float64, float64, float64) {
	rf := float64(r) / 255.0
	gf := float64(g) / 255.0
	bf := float64(b) / 255.0

	max := rf
	if gf > max {
		max = gf
	}
	if bf > max {
		max = bf
	}
	min := rf
	if gf < min {
		min = gf
	}
	if bf < min {
		min = bf
	}

	l := (max + min) / 2.0
	var h, s float64

	if max == min {
		h = 0
		s = 0
	} else {
		d := max - min
		if l > 0.5 {
			s = d / (2.0 - max - min)
		} else {
			s = d / (max + min)
		}
		switch max {
		case rf:
			h = (gf - bf) / d
			if gf < bf {
				h += 6.0
			}
		case gf:
			h = (bf-rf)/d + 2.0
		case bf:
			h = (rf-gf)/d + 4.0
		}
		h *= 60.0
	}
	return h, s, l
}

// HSLをRGBに変換する簡易関数
func hslToRGB(h, s, l float64) color.RGBA {
	var r, g, b float64
	if s == 0 {
		r, g, b = l, l, l
	} else {
		var q float64
		if l < 0.5 {
			q = l * (1.0 + s)
		} else {
			q = l + s - l*s
		}
		p := 2.0*l - q
		r = hueToRGB(p, q, h/360.0+1.0/3.0)
		g = hueToRGB(p, q, h/360.0)
		b = hueToRGB(p, q, h/360.0-1.0/3.0)
	}
	return color.RGBA{
		R: uint8(r*255.0 + 0.5),
		G: uint8(g*255.0 + 0.5),
		B: uint8(b*255.0 + 0.5),
		A: 255,
	}
}

func hueToRGB(p, q, t float64) float64 {
	if t < 0 {
		t += 1.0
	}
	if t > 1 {
		t -= 1.0
	}
	if t < 1.0/6.0 {
		return p + (q-p)*6.0*t
	}
	if t < 1.0/2.0 {
		return q
	}
	if t < 2.0/3.0 {
		return p + (q-p)*(2.0/3.0-t)*6.0
	}
	return p
}
