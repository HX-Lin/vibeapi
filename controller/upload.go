/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

package controller

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"unicode"

	"github.com/gin-gonic/gin"
	"golang.org/x/text/unicode/norm"
)

const (
	uploadDir     = "data/uploads"
	maxUploadSize = 10 << 20 // 10 MB
)

var allowedExtensions = map[string]string{
	// Images
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".gif":  "image/gif",
	".webp": "image/webp",
	".svg":  "image/svg+xml",
	".ico":  "image/x-icon",
	// Documents
	".pdf":  "application/pdf",
	".txt":  "text/plain",
	".json": "application/json",
	".sh":   "text/x-shellscript",
	".ps1":  "text/plain",
	".bat":  "text/plain",
	".md":   "text/markdown",
	".csv":  "text/csv",
	".xml":  "text/xml",
	".yaml": "text/yaml",
	".yml":  "text/yaml",
	".toml": "text/plain",
	".conf": "text/plain",
	".log":  "text/plain",
	".ini":  "text/plain",
}

// imageExtensions is the set of extensions that are images (displayed inline, not downloaded).
var imageExtensions = map[string]bool{
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true,
	".webp": true, ".svg": true, ".ico": true,
}

// filenameRegex validates safe filenames: alphanumeric, CJK characters, hyphens, underscores, dots.
// Must have an allowed extension at the end. No path separators or special chars.
var filenameRegex = regexp.MustCompile(`^[a-zA-Z0-9\x{4e00}-\x{9fff}\x{3040}-\x{309f}\x{30a0}-\x{30ff}\x{ac00}-\x{d7af}_\-][a-zA-Z0-9\x{4e00}-\x{9fff}\x{3040}-\x{309f}\x{30a0}-\x{30ff}\x{ac00}-\x{d7af}_\-\.]*\.[a-z0-9]+$`)

// originalNames maps UUID filenames to their original upload names for Content-Disposition.
var originalNames sync.Map

const nameMapFile = "data/uploads/.namemap"

func init() {
	loadNameMap()
}

func loadNameMap() {
	data, err := os.ReadFile(nameMapFile)
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(data), "\n") {
		parts := strings.SplitN(line, "\t", 2)
		if len(parts) == 2 {
			originalNames.Store(parts[0], parts[1])
		}
	}
}

func saveNameMapping(storedName, originalName string) {
	originalNames.Store(storedName, originalName)
	// Append to file
	f, err := os.OpenFile(nameMapFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	f.WriteString(storedName + "\t" + originalName + "\n")
}

// sanitizeFilename converts an original filename into a safe, readable name.
// It preserves CJK characters, letters, digits, hyphens and underscores.
// Spaces become hyphens, consecutive hyphens are collapsed.
func sanitizeFilename(name string) string {
	// Normalize unicode (NFC)
	name = norm.NFC.String(name)

	var b strings.Builder
	prevHyphen := false
	for _, r := range name {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_' || r == '.' {
			b.WriteRune(r)
			prevHyphen = false
		} else if r == ' ' || r == '-' || r == '\t' {
			if !prevHyphen {
				b.WriteRune('-')
				prevHyphen = true
			}
		}
		// skip all other characters
	}

	result := b.String()
	// Trim leading/trailing hyphens and dots
	result = strings.Trim(result, "-.")
	if result == "" {
		return ""
	}
	return result
}

// generateUniqueFilename finds a non-colliding filename in the upload directory.
// For "photo.png" it tries: photo.png, photo-1.png, photo-2.png, ...
func generateUniqueFilename(dir, baseName, ext string) string {
	candidate := baseName + ext
	if _, err := os.Stat(filepath.Join(dir, candidate)); os.IsNotExist(err) {
		return candidate
	}
	for i := 1; i < 10000; i++ {
		candidate = fmt.Sprintf("%s-%d%s", baseName, i, ext)
		if _, err := os.Stat(filepath.Join(dir, candidate)); os.IsNotExist(err) {
			return candidate
		}
	}
	// Extremely unlikely fallback
	return baseName + "-" + fmt.Sprintf("%d", os.Getpid()) + ext
}

func UploadFile(c *gin.Context) {
	if err := c.Request.ParseMultipartForm(maxUploadSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "文件大小超过限制（最大 10MB）",
		})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "请选择要上传的文件",
		})
		return
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if _, ok := allowedExtensions[ext]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "不支持的文件类型，支持图片(PNG/JPG/GIF/WebP/SVG/ICO)、文档(PDF/TXT/MD/CSV/XML/JSON)和脚本(SH/PS1/BAT/YAML/TOML/CONF/INI/LOG)",
		})
		return
	}

	// Open and validate MIME type by sniffing content
	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "无法读取上传文件",
		})
		return
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, _ := src.Read(buf)
	detectedType := http.DetectContentType(buf[:n])

	// SVG may be detected as text/xml or text/plain
	// Text-based files (sh, ps1, txt, json, md, csv, etc.) are all detected as text/plain
	validMime := false
	if ext == ".svg" {
		validMime = strings.HasPrefix(detectedType, "text/") || detectedType == "image/svg+xml"
	} else if ext == ".ico" {
		validMime = true
	} else if strings.HasPrefix(allowedExtensions[ext], "text/") || ext == ".json" {
		// Text-based files: http.DetectContentType returns text/plain for all of them
		validMime = strings.HasPrefix(detectedType, "text/") || detectedType == "application/json"
	} else {
		validMime = detectedType == allowedExtensions[ext]
		// JPEG can be detected as "image/jpeg" for both .jpg and .jpeg
		if ext == ".jpg" || ext == ".jpeg" {
			validMime = detectedType == "image/jpeg"
		}
	}

	if !validMime {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "文件内容与扩展名不匹配",
		})
		return
	}

	// Reset reader to beginning
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "文件处理失败",
		})
		return
	}

	// Ensure upload directory exists
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "无法创建上传目录",
		})
		return
	}

	// Generate friendly filename from original name
	originalName := filepath.Base(fileHeader.Filename)
	nameWithoutExt := strings.TrimSuffix(originalName, ext)
	sanitized := sanitizeFilename(nameWithoutExt)
	if sanitized == "" {
		// Fallback for filenames that sanitize to empty (e.g. all special chars)
		sanitized = "file"
	}
	// Convert extension to lowercase for consistency
	newFilename := generateUniqueFilename(uploadDir, sanitized, ext)
	dstPath := filepath.Join(uploadDir, newFilename)

	dst, err := os.Create(dstPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "无法保存文件",
		})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		os.Remove(dstPath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "文件写入失败",
		})
		return
	}

	// Save original filename mapping before responding
	saveNameMapping(newFilename, originalName)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    "/uploads/" + newFilename,
	})
}

func ServeUploadedFile(c *gin.Context) {
	filename := c.Param("filename")

	// Validate filename: must match safe pattern and have no path separators
	if !filenameRegex.MatchString(filename) || strings.ContainsAny(filename, "/\\") {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "文件不存在",
		})
		return
	}

	ext := filepath.Ext(filename)
	contentType, ok := allowedExtensions[ext]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "文件不存在",
		})
		return
	}

	fullPath := filepath.Join(uploadDir, filename)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "文件不存在",
		})
		return
	}

	c.Header("Content-Type", contentType)
	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	// Non-image files should trigger download with original filename
	if !imageExtensions[ext] {
		downloadName := filename
		if orig, ok := originalNames.Load(filename); ok {
			downloadName = orig.(string)
		}
		c.Header("Content-Disposition", "attachment; filename=\""+downloadName+"\"")
	}
	c.File(fullPath)
}
