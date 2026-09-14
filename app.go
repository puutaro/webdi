package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"syscall"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/appmode"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/form"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/image"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/list"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/text"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/network"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/windowcmd"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type windowPositionConfig struct {
	x, y   *int
	center bool
}
type windowSizeConfig struct {
	width  int
	height int
}

type App struct {
	ctx                  context.Context
	activeMode           string
	windowPositionConfig windowPositionConfig
	windowSizeConfig     windowSizeConfig

	formCmd         *form.FormCmd
	listCmd         *list.ListCmd
	windowCmd       *windowcmd.WindowCmd
	WindowIconBytes []byte
}

func NewApp(appConfig *args.AppConfig) *App {
	mode := appConfig.CmdName
	if mode == "" {
		mode = appmode.GetAppModes().Form
	}
	windowConfig := appConfig.WindowConfig
	return &App{
		activeMode: mode,
		windowPositionConfig: windowPositionConfig{
			x:      windowConfig.X,
			y:      windowConfig.Y,
			center: windowConfig.Center,
		},
		windowSizeConfig: windowSizeConfig{
			width:  windowConfig.Width,
			height: windowConfig.Height,
		},
		formCmd:         appConfig.FormCmd,
		listCmd:         appConfig.ListCmd,
		WindowIconBytes: image.LoadIconBytes(windowConfig.WindowIcon),
	}
}

func (a *App) GetActiveMode() string {
	return a.activeMode
}
func (a *App) ExitWith252() {
	network.GuiResponse{
		Id:       a.getId(),
		ExitCode: 252,
	}.SendResJson()
}
func (a *App) ExitWithNumber(
	exitCode int,
) {
	network.GuiResponse{
		Id:       a.getId(),
		ExitCode: exitCode,
	}.SendResJson()
}
func (a *App) WriteStdout(str string) {
	fmt.Fprintln(os.Stdout, str)
}
func (a *App) WriteStdoutByHidden(
	stdout string,
	exitCode int,
) {
	network.GuiResponse{
		Id:       a.getId(),
		Stdout:   stdout,
		ExitCode: exitCode,
	}.SendResJson()
}
func (a *App) WriteStderr(str string) {
	fmt.Fprintf(os.Stderr, "\x1b[31m%s\x1b[0m\n", str)
}

func (a *App) GetFormConfig() form.FormConfigResponse {
	if a.formCmd == nil {
		return form.FormConfigResponse{}
	}
	return a.formCmd.GetFormConfig()
}
func (a *App) GetListConfig() list.ListConfigResponse {
	if a.listCmd == nil {
		return list.ListConfigResponse{}
	}
	return a.listCmd.GetListConfig()
}
func (a *App) GetWindowInfo() network.WindowRequestForWebView {
	isKeep := false
	var keepExcludes []string
	switch {
	case a.formCmd != nil:
		formCmd := a.formCmd
		isKeep = formCmd.Keep
		keepExcludes = text.SplitKeepExclude(formCmd.KeepExcludes, ",")
	case a.listCmd != nil:
		listCmd := a.listCmd
		isKeep = listCmd.Keep
		keepExcludes = text.SplitKeepExclude(listCmd.KeepExcludes, ",")
	}
	return network.WindowRequestForWebView{
		IsKeep:       isKeep,
		KeepExcludes: keepExcludes,
	}
}

func (a *App) SelectFile(title string) (string, error) {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	return filePath, err
}
func (a *App) SelectDir(title string) (string, error) {
	dirPath, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	return dirPath, err
}
func (a *App) RunCmd(cmdStr string) error {
	return a.execRunCmd(cmdStr, io.Discard)
}
func (a *App) execRunCmd(cmdStr string, w io.Writer) error {
	cmd := exec.Command("bash", "-c", cmdStr)
	cmd.Stdout = w
	cmd.Stderr = os.Stderr
	// コマンドを実行
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("command failed: %v", err)
	}
	return nil
}

func (a *App) RunReloadCmdForList(cmdStr, line, delimiter string) (string, error) {
	replacedCmdStr := a.replaceHolder(cmdStr, line, delimiter)
	cmd := exec.Command("bash", "-c", replacedCmdStr)
	cmd.Stderr = os.Stderr
	var stdoutBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("command failed: %w", err)
	}
	return strings.TrimSuffix(stdoutBuf.String(), "\n"), nil
}
func (a *App) RunCmdForList(cmdStr, line, delimiter string) error {
	replacedCmdStr := a.replaceHolder(cmdStr, line, delimiter)
	return a.execRunCmd(replacedCmdStr, io.Discard)
}

func (a *App) RunCmdAndExitForList(
	cmdStr,
	line,
	delimiter string,
	exitCode int,
	stdout string,
) {
	replacedCmdStr := a.replaceHolder(cmdStr, line, delimiter)
	err := a.execRunCmd(replacedCmdStr, io.Discard)
	if err != nil {
		fmt.Fprintf(os.Stderr, "command failed: %v\n", err)
	}
	res := network.GuiResponse{
		Id:       a.getId(),
		ExitCode: exitCode,
		Stdout:   stdout,
	}
	res.SendResJson()
}

func (a *App) replaceHolder(cmdStr, line, delimiter string) string {
	replacedCmdStr := strings.ReplaceAll(
		cmdStr,
		"{}",
		line,
	)
	if delimiter != "" {
		fields := strings.Split(line, delimiter)
		for i, field := range fields {
			replacedCmdStr = strings.ReplaceAll(
				replacedCmdStr,
				fmt.Sprintf("{%d}", i+1),
				field,
			)
		}
	}
	return replacedCmdStr
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
	windowPositionConfig := a.windowPositionConfig
	isCenter := windowPositionConfig.center
	x := windowPositionConfig.x
	y := windowPositionConfig.y
	switch true {
	case isCenter:
		runtime.WindowCenter(a.ctx)
	case x != nil && y != nil:
		runtime.WindowSetPosition(a.ctx, *x, *y)
	}
	go func() {
		err := network.UpdateExistInfoByGuiEnable(a.getId())
		if err != nil {
			fmt.Fprintf(os.Stderr, "Info: update miss: %s\n", err.Error())
		}
	}()
	if len(a.WindowIconBytes) > 0 {
		image.ApplyMacAppIcon(a.WindowIconBytes)
	}
	go a.startGuiServer(
		ctx,
	)
	go a.watchOSSignals()
}

func (a *App) getId() string {
	return getIdFromCmd(
		a.formCmd,
		a.listCmd,
		a.windowCmd,
	)
}

func getIdFromCmd(
	formCmd *form.FormCmd,
	listCmd *list.ListCmd,
	windowCmd *windowcmd.WindowCmd,
) string {
	switch {
	case formCmd != nil:
		return formCmd.Id
	case listCmd != nil:
		return listCmd.Id
	case windowCmd != nil:
		return windowCmd.Id
	}
	return ""
}
func getIsGuiModeFromCmd(
	formCmd *form.FormCmd,
	listCmd *list.ListCmd,
) bool {
	switch {
	case formCmd != nil:
		return formCmd.GuiMode
	case listCmd != nil:
		return listCmd.GuiMode
	}
	return false
}
func getisQuitGuiFromCmd(
	formCmd *form.FormCmd,
	listCmd *list.ListCmd,
) bool {
	switch {
	case formCmd != nil:
		return formCmd.QuitGui
	case listCmd != nil:
		return listCmd.QuitGui
	}
	return false
}

func (a *App) sendAllQuitSignal(
	ctx context.Context,
) bool {
	network.GuiResponse{
		Id:       a.getId(),
		ExitCode: exitErrGeneral,
	}.SendResJson()
	a.cleanupAndSendQuitSignal()
	return false
}

func (a *App) MinimizeGui() {
	minimizeGUi(
		a.ctx,
		a.getId(),
	)
}
func (a *App) cleanupAndSendQuitSignal() {
	id := a.getId()
	removeFile(network.GetReqJsonFilePath(id))
	removeFile(network.GetReqJsonFilePath(id))
	network.RemoveExistFile(id)
}

// 【ルートBの監視：main関数やStartupなどでバックグラウンド起動しておく】
func (a *App) watchOSSignals() {
	sigChan := make(chan os.Signal, 1)
	// SIGINT (Ctrl+C) や SIGTERM (通常の kill コマンド) をキャッチ
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigChan
		a.cleanupAndSendQuitSignal()
		os.Exit(0)
	}()
}

func removeFile(filePath string) {
	_, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return
		}
		log.Printf("failure to cean up: %s", err)
		return
	}
	if err := os.Remove(filePath); err != nil {
		log.Printf("failure to cean up: %s", err)
	}
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
