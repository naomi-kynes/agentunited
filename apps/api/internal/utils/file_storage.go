package utils

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"crypto/rand"
	"encoding/hex"
)

const (
	MaxFileSize = 10 << 20 // 10MB
	UploadDir   = "./data/uploads"
)

// AllowedFileTypes defines the allowed MIME types for uploads
var AllowedFileTypes = map[string]bool{
	// Images
	"image/jpeg":    true,
	"image/jpg":     true,
	"image/png":     true,
	"image/gif":     true,
	"image/webp":    true,
	"image/svg+xml": true,
	
	// Documents
	"application/pdf":                                   true,
	"application/msword":                               true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
	"application/vnd.ms-excel":                         true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
	"application/vnd.ms-powerpoint":                    true,
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
	
	// Text files
	"text/plain":       true,
	"text/csv":         true,
	"text/html":        true,
	"text/css":         true,
	"text/javascript":  true,
	"text/xml":         true,
	"application/json": true,
	"application/xml":  true,
	"application/yaml": true,
	
	// Code files
	"application/x-python":     true,
	"application/x-go":         true,
	"application/x-javascript": true,
	"application/typescript":   true,
	
	// Archives
	"application/zip":    true,
	"application/x-tar":  true,
	"application/gzip":   true,
	"application/x-gzip": true,
}

// FileUploadError represents file upload specific errors
type FileUploadError struct {
	Message string
	Code    string
}

func (e *FileUploadError) Error() string {
	return e.Message
}

// Common errors
var (
	ErrFileTooLarge      = &FileUploadError{"File size exceeds 10MB limit", "FILE_TOO_LARGE"}
	ErrInvalidFileType   = &FileUploadError{"File type not allowed", "INVALID_FILE_TYPE"}
	ErrStorageCreate     = &FileUploadError{"Failed to create storage directory", "STORAGE_CREATE_FAILED"}
	ErrFileWrite         = &FileUploadError{"Failed to write file", "FILE_WRITE_FAILED"}
	ErrFileRead          = &FileUploadError{"Failed to read uploaded file", "FILE_READ_FAILED"}
)

// InitializeStorage ensures the upload directory exists
func InitializeStorage() error {
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		return fmt.Errorf("create upload directory: %w", err)
	}
	return nil
}

// GenerateFileName creates a unique filename with timestamp and random suffix
func GenerateFileName(originalName string) string {
	// Get file extension
	ext := filepath.Ext(originalName)
	
	// Generate random bytes
	randomBytes := make([]byte, 8)
	rand.Read(randomBytes)
	randomStr := hex.EncodeToString(randomBytes)
	
	// Create filename: timestamp_random.ext
	timestamp := time.Now().Format("20060102_150405")
	return fmt.Sprintf("%s_%s%s", timestamp, randomStr, ext)
}

// ValidateFile checks file size and type
func ValidateFile(fileHeader *multipart.FileHeader) error {
	// Check file size
	if fileHeader.Size > MaxFileSize {
		return ErrFileTooLarge
	}
	
	// Get MIME type from file header
	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		// Try to infer from file extension
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".gif":
			contentType = "image/gif"
		case ".pdf":
			contentType = "application/pdf"
		case ".txt":
			contentType = "text/plain"
		case ".json":
			contentType = "application/json"
		case ".go":
			contentType = "application/x-go"
		case ".py":
			contentType = "application/x-python"
		case ".js":
			contentType = "text/javascript"
		case ".ts":
			contentType = "application/typescript"
		case ".html":
			contentType = "text/html"
		case ".css":
			contentType = "text/css"
		case ".csv":
			contentType = "text/csv"
		case ".zip":
			contentType = "application/zip"
		default:
			contentType = "application/octet-stream"
		}
	}
	
	// Check if file type is allowed
	if !AllowedFileTypes[contentType] {
		return ErrInvalidFileType
	}
	
	return nil
}

// SaveFile saves the uploaded file to the storage directory
func SaveFile(fileHeader *multipart.FileHeader) (string, string, error) {
	// Validate file first
	if err := ValidateFile(fileHeader); err != nil {
		return "", "", err
	}
	
	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return "", "", ErrFileRead
	}
	defer file.Close()
	
	// Generate unique filename
	fileName := GenerateFileName(fileHeader.Filename)
	filePath := filepath.Join(UploadDir, fileName)
	
	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", "", ErrFileWrite
	}
	defer dst.Close()
	
	// Copy file contents
	_, err = io.Copy(dst, file)
	if err != nil {
		// Clean up on error
		os.Remove(filePath)
		return "", "", ErrFileWrite
	}
	
	// Return the URL path and original filename
	urlPath := fmt.Sprintf("/uploads/%s", fileName)
	return urlPath, fileHeader.Filename, nil
}