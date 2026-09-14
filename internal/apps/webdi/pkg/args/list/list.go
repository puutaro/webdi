package list

import (
	"fmt"
	"strings"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/design"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/gui"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/image"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/text"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/unique"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/window"
)

type ListCmd struct {
	List        string   `arg:"positional" help:"string contents separated by newline"`
	IsStdin     bool     `arg:"--is-stdin,hidden" default:"false" help:"use gui server luanch"`
	Reloads     []string `arg:"--reload,separate" help:"(alt/option)+key:shell reload list by shell stdout"`
	Executes    []string `arg:"--execute,separate" help:"(alt/option)+key:exec shell by shell stdout"`
	ExecQuits   []string `arg:"--exec-quit,separate" help:"(alt/option)+key:exit code:exec shell with exit by shell stdout"`
	Delimiter   string   `arg:"--delimiter" default:"" help:"delimiter about line in list"`
	WithNth     int      `arg:"--with-nth" default:"0" help:"display field by delimiter"`
	HeaderLines int      `arg:"--header-lines" default:"0" help:"display first line by header"`
	Cycle       bool     `arg:"--cycle" default:"false" help:"cycle cursor"`
	design.Design
	window.WindowOptions
	gui.GuiOptions
	unique.Unique
}

func (c *ListCmd) GetWindowConfig() window.WindowOptions {
	return window.WindowOptions{
		Width:  c.Width,
		Height: c.Height,
		X:      c.X,
		Y:      c.Y,
	}
}

type ListConfigResponse struct {
	Id          string          `json:"id"`
	WindowIcon  string          `json:"windowIcon"`
	Title       string          `json:"title"`
	Text        string          `json:"text"`
	List        []string        `json:"list"`
	Borders     int             `json:"borders"`
	FontSize    int             `json:"fontSize"`
	Reloads     []ExecuteConfig `json:"reloads"`
	Executes    []ExecuteConfig `json:"executes"`
	ExecQuits   []ExecuteConfig `json:"execQuits"`
	Delimiter   string          `json:"delimiter"`
	WithNth     int             `json:"withNth"`
	HeaderLines int             `json:"headerLines"`
	Cycle       bool            `json:"cycle"`
}

type ExecuteConfig struct {
	Key      string `json:"key"`
	Shell    string `json:"shell"`
	ExitCode int    `json:"exitCode"`
}

func (cmd *ListCmd) GetListConfig() ListConfigResponse {
	reloadsSrcList := cmd.Reloads
	reloads := make([]ExecuteConfig, len(reloadsSrcList))
	for i, reloadStr := range reloadsSrcList {
		reloads[i] = cmd.parseKeyShell(reloadStr)
	}
	executesSrcList := cmd.Executes
	executes := make([]ExecuteConfig, len(executesSrcList))
	for i, executeStr := range executesSrcList {
		executes[i] = cmd.parseKeyShell(executeStr)
	}
	execQuitsSrcList := cmd.ExecQuits
	execQuits := make([]ExecuteConfig, len(execQuitsSrcList))
	for i, quitExecStr := range execQuitsSrcList {
		execQuits[i] = cmd.parseKeyExitShell(quitExecStr)
	}
	return ListConfigResponse{
		Id:          cmd.Id,
		WindowIcon:  image.ImageToBase64(cmd.WindowIcon),
		Title:       cmd.Title,
		Text:        text.TextUnescapeNewlinesTab(cmd.Text.String(false)),
		List:        strings.Split(cmd.List, "\n"),
		Borders:     cmd.Design.Borders,
		FontSize:    cmd.Design.FontSize,
		Reloads:     reloads,
		Executes:    executes,
		ExecQuits:   execQuits,
		Delimiter:   cmd.Delimiter,
		WithNth:     cmd.WithNth - 1,
		HeaderLines: cmd.HeaderLines,
		Cycle:       cmd.Cycle,
	}
}

func (cmd ListCmd) parseKeyShell(keyShellStr string) ExecuteConfig {
	key, shell, _ := strings.Cut(keyShellStr, ":")
	return ExecuteConfig{
		Key:   key,
		Shell: shell,
	}
}
func (cmd ListCmd) parseKeyExitShell(keyExitShellStr string) ExecuteConfig {
	keyExitShellList := strings.Split(keyExitShellStr, ":")
	key := keyExitShellList[0]
	keyExitShellListLen := len(keyExitShellList)
	exitCode := 0
	if keyExitShellListLen > 1 {
		fmt.Sscanf(keyExitShellList[1], "%d", &exitCode)
	}
	shell := ""
	if keyExitShellListLen > 2 {
		shell = keyExitShellList[2]
	}
	return ExecuteConfig{
		Key:      key,
		Shell:    shell,
		ExitCode: exitCode,
	}
}
