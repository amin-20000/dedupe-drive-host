// Update the CORS configuration in setupRouter() function

router.Use(cors.New(cors.Config{
	AllowOrigins:     []string{"http://localhost:8081"}, // Frontend runs on 8081
	AllowMethods:     []string{"GET", "POST", "DELETE", "OPTIONS"},
	AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
	ExposeHeaders:    []string{"Content-Length"},
	AllowCredentials: true,
	MaxAge:           12 * time.Hour,
}))

// The backend authentication middleware should support both Authorization header
// and query parameter authentication for preview endpoints:

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

// The search handler needs these additional filters in the searchFilesHandler function:

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

// End date filter
if endDate := c.Query("end_date"); endDate != "" {
	conditions = append(conditions, fmt.Sprintf("uf.created_at <= $%d", argID))
	args = append(args, endDate)
	argID++
}