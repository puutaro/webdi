package design

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const filePrefix = "file://"
const webdiPrefix = "webdi://"

func readFilePrefixOrCon(line string) ([]byte, error) {
	lineTrimed := strings.TrimSpace(line)
	switch {
	case strings.HasPrefix(
		lineTrimed,
		filePrefix,
	):
		return readFilePrefixByDirect(lineTrimed)
	case strings.HasPrefix(
		lineTrimed,
		webdiPrefix,
	):
		return readWebdiPrefixByDirect(lineTrimed)
	}
	return []byte(lineTrimed), nil
}
func readFilePrefixByDirect(line string) ([]byte, error) {
	body, _ := strings.CutPrefix(line, filePrefix)
	fileByte, err := os.ReadFile(body)
	if err != nil {
		return nil, err
	}
	return fileByte, nil
}

func readFilePrefix(line string) ([]byte, error) {
	if !strings.HasPrefix(
		line,
		filePrefix,
	) {
		return []byte(line), nil
	}
	return readFilePrefixByDirect(line)
}

func readWebdiPrefixByDirect(line string) ([]byte, error) {
	body, _ := strings.CutPrefix(line, webdiPrefix)
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failure to get home dir path: %v", err)
	}
	targetFilePath := filepath.Join(homeDir, ".webdi", body)
	fileByte, err := os.ReadFile(targetFilePath)
	if err != nil {
		return nil, err
	}
	return fileByte, nil
}
func readWebdiPrefix(line string) ([]byte, error) {
	if !strings.HasPrefix(
		line,
		webdiPrefix,
	) {
		return []byte(line), nil
	}
	return readFilePrefixByDirect(line)
}
