package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
)

// Add query parameter authentication support to authMiddleware
func (app *App) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		var tokenString string

		if authHeader != "" {
			// Bearer token authentication
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else if queryAuth := c.Query("auth"); queryAuth != "" {
			// Query parameter authentication for preview endpoints
			tokenString = queryAuth
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Next()
	}
}

// Updated searchFilesHandler with all search filters
func (app *App) searchFilesHandler(c *gin.Context) {
	userID := c.MustGet("userID").(int)

	// Build a dynamic SQL query safely using placeholders to prevent SQL injection.
	baseQuery := `
        FROM user_files uf
        JOIN physical_files pf ON uf.physical_file_hash = pf.hash
        WHERE uf.user_id = $1`
	args := []interface{}{userID}
	argID := 2 // Argument counter starts at $2 since $1 is the userID.

	// Add conditions to the query based on URL parameters.
	var conditions []string
	
	// Filename filter
	if filename := c.Query("filename"); filename != "" {
		conditions = append(conditions, fmt.Sprintf("uf.filename ILIKE $%d", argID))
		args = append(args, "%"+filename+"%")
		argID++
	}
	
	// MIME type filter
	if mimeType := c.Query("mime_type"); mimeType != "" {
		conditions = append(conditions, fmt.Sprintf("uf.mime_type = $%d", argID))
		args = append(args, mimeType)
		argID++
	}
	
	// Minimum size filter
	if minSize := c.Query("min_size_bytes"); minSize != "" {
		conditions = append(conditions, fmt.Sprintf("pf.size_bytes >= $%d", argID))
		args = append(args, minSize)
		argID++
	}
	
	// Maximum size filter
	if maxSize := c.Query("max_size_bytes"); maxSize != "" {
		conditions = append(conditions, fmt.Sprintf("pf.size_bytes <= $%d", argID))
		args = append(args, maxSize)
		argID++
	}
	
	// Start date filter
	if startDate := c.Query("start_date"); startDate != "" {
		conditions = append(conditions, fmt.Sprintf("uf.created_at >= $%d", argID))
		args = append(args, startDate)
		argID++
	}
	
	// End date filter
	if endDate := c.Query("end_date"); endDate != "" {
		conditions = append(conditions, fmt.Sprintf("uf.created_at <= $%d", argID))
		args = append(args, endDate)
		argID++
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	// --- Pagination for Search Results ---
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	// Count total files that match the search filter for pagination.
	var totalFiles int
	countQuery := "SELECT COUNT(*)" + baseQuery
	err := app.db.QueryRow(context.Background(), countQuery, args...).Scan(&totalFiles)
	if err != nil {
		log.Printf("Search count query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count filtered files"})
		return
	}

	// Fetch the filtered and paginated data.
	selectQuery := "SELECT uf.id, uf.filename, pf.size_bytes, uf.mime_type, uf.created_at" + baseQuery +
		fmt.Sprintf(" ORDER BY uf.created_at DESC LIMIT $%d OFFSET $%d", argID, argID+1)
	args = append(args, pageSize, offset)

	rows, err := app.db.Query(context.Background(), selectQuery, args...)
	if err != nil {
		log.Printf("Search query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve filtered files"})
		return
	}
	defer rows.Close()

	files := []FileResponse{}
	for rows.Next() {
		var file FileResponse
		if err := rows.Scan(&file.ID, &file.Filename, &file.SizeBytes, &file.MimeType, &file.CreatedAt); err != nil {
			log.Printf("Failed to scan search result: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process filtered file data"})
			return
		}
		files = append(files, file)
	}

	c.JSON(http.StatusOK, FileListResponse{
		Files: files,
		Pagination: Pagination{
			CurrentPage: page,
			TotalPages:  int(math.Ceil(float64(totalFiles) / float64(pageSize))),
			TotalFiles:  totalFiles,
		},
	})
}