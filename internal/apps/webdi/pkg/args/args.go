package args

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"unicode/utf8"

	"github.com/BurntSushi/toml"
	"github.com/alexflint/go-arg"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/form"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/list"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/window"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/network"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/windowcmd"
)

type CLI struct {
	Form   *form.FormCmd        `arg:"subcommand:form" help:"Launch a form dialog"`
	List   *list.ListCmd        `arg:"subcommand:list" help:"Launch a list dialog"`
	Window *windowcmd.WindowCmd `arg:"subcommand:window" help:"manipulate dialog window"`
}
type AppConfig struct {
	CmdName      string
	WindowConfig window.WindowOptions

	WindowCmd *windowcmd.WindowCmd
	FormCmd   *form.FormCmd
	ListCmd   *list.ListCmd
}

func (CLI) Version() string {
	var info WebdiInfo
	if _, err := toml.Decode(string(WebdiInfoRaw), &info); err != nil {
		return ""
	}
	return info.Webdi.Version
}

func Parse() (*AppConfig, error) {
	var args CLI
	arg.MustParse(&args)
	formCmd := args.Form
	listCmd := args.List
	windowCmd := args.Window
	switch {
	case formCmd != nil &&
		formCmd.GuiOptions.QuitGui &&
		formCmd.Unique.Id == "":
		return nil, fmt.Errorf("Require id, when --guit-gui is specified\n")
	case listCmd != nil &&
		listCmd.GuiOptions.QuitGui &&
		listCmd.Unique.Id == "":
		return nil, fmt.Errorf("Require id, when --guit-gui is specified\n")
	}
	switch {
	case formCmd != nil && formCmd.Id == "":
		formCmd.Id = network.GetMachineId()
	case listCmd != nil && listCmd.Id == "":
		listCmd.Id = network.GetMachineId()
	case windowCmd != nil && windowCmd.Id == "":
		windowCmd.Id = network.GetMachineId()
	}
	switch {
	case formCmd != nil:
		if err := validateId(args.Form.Id); err != nil {
			return nil, err
		}
	case listCmd != nil:
		if err := validateId(args.List.Id); err != nil {
			return nil, err
		}
	case windowCmd != nil:
		if err := validateId(args.Window.Id); err != nil {
			return nil, err
		}
	}
	switch {
	case listCmd != nil:
		stat, err := os.Stdin.Stat()
		if err != nil || (stat.Mode()&os.ModeCharDevice) != 0 {
			break
		}
		var lines []string
		scanner := bufio.NewScanner(os.Stdin)
		// スキャナーで1行ずつループして読み込む
		for scanner.Scan() {
			lines = append(lines, scanner.Text())
		}
		if err := scanner.Err(); err != nil {
			return nil, fmt.Errorf("error reading stdin: %v\n", err)
		}
		// 読み込んだ行を改行で結合して格納する
		if len(lines) > 0 {
			args.List.List = strings.Join(lines, "\n")
			args.List.IsStdin = true
		}
	}
	cmdName := "form"
	var windowConfig window.WindowOptions
	switch {
	case formCmd != nil:
		windowConfig = formCmd.WindowOptions
	case listCmd != nil:
		windowConfig = listCmd.WindowOptions
		cmdName = "list"
	case windowCmd != nil:
		cmdName = "window"
	}
	return &AppConfig{
		CmdName:      cmdName,
		WindowConfig: windowConfig,
		FormCmd:      args.Form,
		ListCmd:      args.List,
		WindowCmd:    args.Window,
	}, nil
}

func validateId(path string) error {
	idKey := "id"
	// 1. 空文字チェック
	if strings.TrimSpace(path) == "" {
		return fmt.Errorf("%s cannot be empty", idKey)
	}
	// 2. パス全体の長さチェック (通常は4096バイト未満)
	if len(path) > 4096 {
		return fmt.Errorf("%s is too long (exceeds 4096 bytes)", idKey)
	}
	// 3. 各文字単位での危険文字チェック
	for i, r := range path {
		switch {
		// ヌル文字 (パスの途中で途切れる原因)
		case r == '\x00':
			return fmt.Errorf("%s contains null character at index %d", idKey, i)
		// 改行文字 (LF, CR。スクリプトやログのパースを壊す)
		case r == '\n' || r == '\r':
			return fmt.Errorf("%s contains newline character at index %d", idKey, i)
		// シェルのメタ文字・制御文字（インジェクションやパース崩れを防ぐため厳格に弾く場合）
		// 必要に応じて許可する文字に合わせて調整してください
		case r == ';' || r == '&' || r == '|' || r == '`' || r == '$' || r == '<' || r == '>':
			return fmt.Errorf("%s contains dangerous shell meta character '%c' at index %d", idKey, r, i)
		// ダブルクォーテーション・シングルクォーテーション
		case r == '"' || r == '\'':
			return fmt.Errorf("%s contains quote character '%c' at index %d", idKey, r, i)
		}
	}
	// 4. 個別のファイル名セグメントごとのチェック（必要に応じて）
	// パスをスラッシュで分割して、各要素をチェック
	segments := strings.Split(path, "/")
	for _, seg := range segments {
		// セグメントが長すぎる場合（通常は255バイト以下）
		if len(seg) > 255 {
			return fmt.Errorf("%s is too long (exceeds 255 bytes)", idKey)
		}
		// 「.」や「..」単体の混入を厳しく弾きたい場合
		if seg == "." || seg == ".." {
			return fmt.Errorf("%s segment cannot be '.' or '..'", idKey)
		}
	}
	// 不正なUTF-8シーケンスが含まれていないかチェック
	if !utf8.ValidString(path) {
		return fmt.Errorf("%s contains invalid UTF-8 sequence", idKey)
	}
	return nil
}
