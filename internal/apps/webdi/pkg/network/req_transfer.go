package network

import (
	"encoding/json"
	"fmt"

	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/form"
	"github.com/puutaro/webdi/internal/apps/webdi/pkg/args/list"
)

type GuiRequest struct {
	Id            string                  `json:"id"`
	ViewMode      string                  `json:"viewMode"`
	Form          form.FormConfigResponse `json:"form"`
	List          list.ListConfigResponse `json:"list"`
	WindowRequest `json:"geometry"`
}
type GuiRequestForWebview struct {
	Id         string                  `json:"id"`
	ViewMode   string                  `json:"viewMode"`
	Form       form.FormConfigResponse `json:"form"`
	List       list.ListConfigResponse `json:"list"`
	WindowInfo WindowRequestForWebView `json:"windowInfo"`
}
type WindowRequestForWebView struct {
	IsKeep       bool     `json:"isKeep"`
	KeepExcludes []string `json:"keepExcludes"`
}
type WindowRequest struct {
	Width        int      `json:"width"`
	Height       int      `json:"height"`
	IsCenter     bool     `json:"is_center"`
	X            *int     `json:"x"`
	Y            *int     `json:"y"`
	IsHidden     bool     `json:"isHidden"`
	IsKeep       bool     `json:"isKeep"`
	KeepExcludes []string `json:"keepExcludes"`
}

func (req GuiRequest) SendReqJson() error {
	fileBytes, err := json.MarshalIndent(req, "", "  ")
	if err != nil {
		return err
	}
	return SendJsonBytesToFile(
		fileBytes,
		GetReqJsonFilePath(req.Id),
	)
}
func (req *GuiRequest) LoadReqJson() error {
	fileBytes, err := LoadFileAsBytes(GetReqJsonFilePath(req.Id))
	if err != nil {
		return err
	}
	// 修正: &req ではなく req をそのまま渡す
	if err := json.Unmarshal(fileBytes, req); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	return nil
}
