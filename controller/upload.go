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
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	uploadDir     = "data/uploads"
	maxUploadSize = 10 << 20 // 10 MB
)

var allowedExtensions = map[string]string{
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".gif":  "image/gif",
	".webp": "image/webp",
	".svg":  "image/svg+xml",
	".ico":  "image/x-icon",
	".pdf":  "application/pdf",
}

// filenameRegex validates UUID-based filenames to prevent path traversal.
var filenameRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z]+$`)

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
			"message": "不支持的文件类型，仅支持 PNG, JPG, GIF, WebP, SVG, ICO, PDF",
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
	validMime := false
	if ext == ".svg" {
		validMime = strings.HasPrefix(detectedType, "text/") || detectedType == "image/svg+xml"
	} else {
		validMime = detectedType == allowedExtensions[ext]
		// JPEG can be detected as "image/jpeg" for both .jpg and .jpeg
		if ext == ".jpg" || ext == ".jpeg" {
			validMime = detectedType == "image/jpeg"
		}
		// ICO may be detected as various types
		if ext == ".ico" {
			validMime = true
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

	// Generate UUID filename
	newFilename := uuid.New().String() + ext
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    "/uploads/" + newFilename,
	})
}

func ServeUploadedFile(c *gin.Context) {
	filename := c.Param("filename")

	// Strict validation: only UUID-format filenames with allowed extensions
	if !filenameRegex.MatchString(filename) {
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
	c.File(fullPath)
}
