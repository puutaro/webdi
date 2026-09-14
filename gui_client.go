package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/form"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/list"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/text"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/network"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/proc"
)

func (app *App) GetSendRequest() network.GuiRequestForWebview {
	return network.GuiRequestForWebview{}
}

func sendReqToGui(
	appConfig *args.AppConfig,
) {
	winReq := network.WindowRequest{}
	formConfig := form.FormConfigResponse{}
	listConfig := list.ListConfigResponse{}
	id := ""
	switch {
	case appConfig.FormCmd != nil:
		formCmd := appConfig.FormCmd
		id = formCmd.Id
		formConfig = formCmd.GetFormConfig()
		winReq = network.WindowRequest{
			Width:        formCmd.Width,
			Height:       formCmd.Height,
			IsCenter:     formCmd.Center,
			X:            formCmd.X,
			Y:            formCmd.Y,
			IsHidden:     formCmd.WindowOptions.Hidden,
			IsKeep:       formCmd.WindowOptions.Keep,
			KeepExcludes: text.SplitKeepExclude(formCmd.KeepExcludes, ","),
		}
	case appConfig.ListCmd != nil:
		listCmd := appConfig.ListCmd
		id = listCmd.Id
		listConfig = listCmd.GetListConfig()
		winReq = network.WindowRequest{
			Width:        listCmd.Width,
			Height:       listCmd.Height,
			IsCenter:     listCmd.Center,
			X:            listCmd.X,
			Y:            listCmd.Y,
			IsHidden:     listCmd.WindowOptions.Hidden,
			IsKeep:       listCmd.WindowOptions.Keep,
			KeepExcludes: text.SplitKeepExclude(listCmd.KeepExcludes, ","),
		}
	case appConfig.WindowCmd != nil:
		id = appConfig.WindowCmd.Id
	}
	sendReq := network.GuiRequest{
		Id:            id,
		ViewMode:      appConfig.CmdName,
		Form:          formConfig,
		List:          listConfig,
		WindowRequest: winReq,
	}
	sendReq.SendReqJson()
}
func serveGuiRes(
	uniqueId string,
	isQuitGui bool,
) {
	clientCh := make(chan string, 1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go network.StartServer(
		ctx,
		network.GetResJsonFilePath(uniqueId),
		clientCh,
	)
	for {
		select {
		case jsonPath := <-clientCh:
			if err := handleRes(
				uniqueId,
				jsonPath,
				isQuitGui,
			); err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(exitErrGeneral)
				return
			}
		case <-ctx.Done():
			log.Println("Main loop stopped.")
			return
		}
	}
}

func handleRes(
	uniqueId string,
	jsonPath string,
	isQuitGui bool,
) error {
	fileBytes, err := network.LoadFileAsBytes(jsonPath)
	if err != nil {
		return fmt.Errorf("failed to read JSON file: %w", err)
	}
	os.Remove(jsonPath)
	// 2. 構造体にパース（デコード）する
	var recievRes network.GuiResponse
	if err := json.Unmarshal(fileBytes, &recievRes); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	switch {
	case isQuitGui:
		proc.Kill(
			proc.GetPidByGuiProcessRunning(uniqueId),
		)
	}
	if recievRes.Stdout != "" {
		fmt.Fprintln(os.Stdout, recievRes.Stdout)
	}
	// 🌟 2. 【最重要】バッファに残ったデータを強制的にパイプへ押し出す
	// これをしないと、直後のCloseでデータが消える可能性があります
	_ = os.Stdout.Sync()

	// 🌟 3. 出力ストリームを閉じる
	// これにより、grep側に「データはこれで全部だよ（EOF）」と伝わり、grep側が正常終了します
	// _ = os.Stdout.Close()
	// _ = os.Stderr.Close()
	// _ = os.Stdin.Close()
	os.Exit(recievRes.ExitCode)
	return nil
}
