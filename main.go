//go:generate sh -c "sh ./gen_webdi_info.sh"
package main

import (
	"embed"
	"fmt"
	"os"
	"strings"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/guiproc"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/network"
)

const (
	exitSuccess    = 0
	exitErrGeneral = 1
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	isWailsTool := false
	for _, arg := range os.Args {
		// wailsbindings や wails の文字が含まれているかチェック
		if strings.Contains(arg, "wailsbindings") || strings.Contains(arg, "wails") {
			isWailsTool = true
			break
		}
	}
	appConfig := &args.AppConfig{}
	isGuiMode := false
	isWindwoCmd := false
	var parseErr error
	switch {
	case isWailsTool:
		isGuiMode = true
	default:
		// 通常実行時のみ、本来の go-arg パースを実行する
		appConfig, parseErr = args.Parse()
		if parseErr != nil {
			fmt.Fprintf(os.Stderr, "%s\n", parseErr)
			os.Exit(exitErrGeneral)
		}
		isWindwoCmd = appConfig.WindowCmd != nil
		isGuiMode = getIsGuiModeFromCmd(
			appConfig.FormCmd,
			appConfig.ListCmd,
		)
	}
	if parseErr != nil {
		fmt.Fprintf(os.Stderr, "%s\n", parseErr)
		os.Exit(exitErrGeneral)
	}
	uniqueId := getIdFromCmd(
		appConfig.FormCmd,
		appConfig.ListCmd,
		appConfig.WindowCmd,
	)
	isGuiProcess := false
	var IsGuiProcessRunningErr error
	if !isWailsTool {
		isGuiProcess, IsGuiProcessRunningErr =
			network.IsGuiProcessRunning(uniqueId)
	}
	if IsGuiProcessRunningErr != nil {
		fmt.Fprintf(
			os.Stderr,
			"Info:IsGuiProcessRunning: %s\n",
			IsGuiProcessRunningErr.Error(),
		)
	}
	if isGuiMode &&
		!isGuiProcess &&
		!isWindwoCmd {
		err := startsGui(appConfig)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %s\n", err.Error())
			os.Exit(exitErrGeneral)
		}
		return
	}
	if !isGuiProcess && !isWindwoCmd {
		pid, err := guiproc.ExecGuiCmd(os.Args[1:], appConfig)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %s\n", err.Error())
			os.Exit(exitErrGeneral)
		}
		if err := network.CreateExistFile(uniqueId, pid); err != nil {
			fmt.Fprintf(os.Stderr, "Info:CreateExistFile: %s\n", err)
		}
	}
	if isGuiProcess {
		sendReqToGui(appConfig)
	}
	if isWindwoCmd {
		return
	}
	serveGuiRes(
		uniqueId,
		getisQuitGuiFromCmd(
			appConfig.FormCmd,
			appConfig.ListCmd,
		),
	)
}
