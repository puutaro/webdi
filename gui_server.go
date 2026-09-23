package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	// goruntime "runtime"

	"github.com/fstanis/screenresolution"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/image"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/list"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/network"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/windowtool"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func startsGui(appConfig *args.AppConfig) error {
	windowConfig := appConfig.WindowConfig
	// Create an instance of the app structure
	app := NewApp(
		appConfig,
	)
	r, g, b, _ := getWallRgb(*appConfig)
	image.ApplyMacAppIcon(app.WindowIconBytes)
	// Create application with options
	err := wails.Run(&options.App{
		Title: windowConfig.Title,
		Windows: &windows.Options{
			DisableWindowIcon: false,
		},
		Linux: &linux.Options{
			Icon:                app.WindowIconBytes,
			WindowIsTranslucent: false,
		},
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHidden(),
			Appearance:           mac.NSAppearanceNameAqua,
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			// macOSに「通常の最前面アプリ」として認識させ、起動時に後ろに回るのを防ぐ
			About: &mac.AboutInfo{
				Title: windowConfig.Title,
				Icon:  app.WindowIconBytes,
			},
		},
		Width:  windowConfig.Width,
		Height: windowConfig.Height,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		// ★ 遅延と背面隠れの主因となる Frameless（枠なし）を false（標準ウィンドウ）に修正
		Frameless:        true,
		BackgroundColour: &options.RGBA{R: r, G: g, B: b, A: 1},
		OnStartup:        app.startup,
		OnBeforeClose:    app.sendAllQuitSignal,
		Bind: []interface{}{
			app,
		},
	})
	return err
}

func getWallRgb(
	appConfig args.AppConfig,
) (uint8, uint8, uint8, float64) {
	switch {
	case appConfig.FormCmd != nil:
		return appConfig.FormCmd.Design.Background.GetWallColor()
	case appConfig.ListCmd != nil:
		return appConfig.ListCmd.Design.Background.GetWallColor()
	}
	return 255, 255, 255, 1
}

func (app *App) startGuiServer(
	ctx context.Context,
) {
	id := getIdFromCmd(
		app.formCmd,
		app.listCmd,
		app.windowCmd,
	)
	srvCh := make(chan string, 1)
	go network.StartServer(
		ctx,
		network.GetReqJsonFilePath(id),
		srvCh,
	)
	for {
		select {
		case jsonPath := <-srvCh:
			// チャネルからパスが送られてくるたびに実行
			app.handleLoadAndSend(ctx, jsonPath)
		case <-ctx.Done():
			log.Println("Main loop stopped.")
			return
		}
	}
}

func (a *App) HandleSendRequest(req network.GuiRequestForWebview) {
	// ここで受け取ったリクエストを処理する
}

func (app *App) handleLoadAndSend(
	ctx context.Context,
	reqPath string,
) {
	// 連続イベント対策として、ファイルが完全に書き込まれるのを微小時間だけ待つか、そのまま処理
	loadErr := app.loadAndSendJson(
		ctx,
		reqPath,
	)
	if loadErr != nil {
		log.Printf("failed to load and send JSON: %v\n", loadErr)
	}
}

func (a *App) loadAndSendJson(
	ctx context.Context,
	filePath string,
) error {
	// 1. JSONファイルを開く
	fileBytes, err := network.LoadFileAsBytes(filePath)
	if err != nil {
		return fmt.Errorf("failed to read JSON file: %w", err)
	}
	os.Remove(filePath)
	// 2. 構造体にパース（デコード）する
	var sendSrcReq network.GuiRequest
	if err := json.Unmarshal(fileBytes, &sendSrcReq); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	if sendSrcReq.ViewMode == "window" {
		windowtool.CustomShow(a.ctx)
		// runtime.WindowUnminimise(a.ctx)
		// runtime.WindowShow(a.ctx)
		return nil
	}
	winReq := sendSrcReq.WindowRequest
	if !winReq.IsHidden {
		windowtool.CustomShow(a.ctx)
		// runtime.WindowUnminimise(a.ctx)
		// runtime.WindowShow(a.ctx)
	}

	winWidth := winReq.Width
	winHeight := winReq.Height
	switch {
	case winReq.IsCenter:
		res := screenresolution.GetPrimary()
		if res == nil {
			runtime.WindowCenter(ctx)
		} else {
			x := (res.Width - winWidth) / 2
			y := (res.Height - winHeight) / 2
			runtime.WindowSetPosition(a.ctx, x, y)
		}
	case winReq.X != nil && winReq.Y != nil:
		runtime.WindowSetPosition(
			ctx,
			*winReq.X,
			*winReq.Y,
		)
	}
	runtime.WindowSetSize(
		ctx,
		winWidth,
		winHeight,
	)
	switch {
	case sendSrcReq.Form.Title != "":
		runtime.WindowSetTitle(ctx, sendSrcReq.Form.Title)
	case sendSrcReq.List.Title != "":
		runtime.WindowSetTitle(ctx, sendSrcReq.List.Title)
	}
	// 3. Wailsのイベント機能を使ってGUIにプッシュ送信する
	// 第一引数: コンテキスト
	// 第二引数: フロントエンド側で待ち受けるイベント名（任意）
	// 第三引数: 送りたいデータ（Wailsが自動でJSのオブジェクトに変換してくれます）
	runtime.EventsEmit(a.ctx, "req", network.GuiRequestForWebview{
		Id:       sendSrcReq.Id,
		ViewMode: sendSrcReq.ViewMode,
		Form:     sendSrcReq.Form,
		List:     sendSrcReq.List,
		WindowInfo: network.WindowRequestForWebView{
			IsKeep:       winReq.IsKeep,
			KeepExcludes: winReq.KeepExcludes,
		},
	})

	return nil
}
func minimizeGUi(
	ctx context.Context,
	id string,
) {
	title := "Webdi sleeping..."
	runtime.WindowSetTitle(ctx, title)
	runtime.EventsEmit(ctx, "req", network.GuiRequestForWebview{
		Id:       id,
		ViewMode: "list",
		List: list.ListConfigResponse{
			Title: title,
			Text:  "Sleeping...",
		},
	})
	// time.Sleep(50 * time.Millisecond)
	windowtool.CustomMinimise(ctx)
	// runtime.WindowMinimise(ctx)
}

// func customMinimise2(ctx context.Context) {
// 	if goruntime.GOOS == "darwin" {
// 		// 自分自身の名前を特定しようとせず、シンプルに「今一番手前にあるアプリ（＝自分）を非表示にする」命令を送ります。
// 		// これにより、macOSの標準機能（Command+Hと同様）で、直前に触っていたアプリへ確実にフォーカスが戻ります。
// 		cmd := exec.Command("osascript", "-e", "tell application \"System Events\" to set visible of first application process whose frontmost is true to false")
// 		_ = cmd.Run()

// 		// OS側のフォーカス移動を反映させるためのウェイト
// 		time.Sleep(50 * time.Millisecond)
// 	}

// 	// Wailsのウィンドウを最小化します
// 	runtime.WindowMinimise(ctx)
// }
