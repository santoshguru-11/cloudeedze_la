# 🔌 API Documentation

This document provides comprehensive API documentation for the Cloudedze application.

## 🌐 Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## 🔐 Authentication

The API uses session-based authentication. All protected endpoints require a valid session cookie.

### Authentication Flow

1. **Login** via `POST /api/auth/login`
2. **Session cookie** is automatically set
3. **Include session cookie** in subsequent requests
4. **Logout** via `POST /api/auth/logout`

## 📚 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword123",
    "firstName": "John",
    "lastName": "Doe"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User registered successfully",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "createdAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Invalid input data
- `409` - Email already exists
- `500` - Server error

#### POST `/api/auth/login`

Authenticate user and create session.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
    }
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials
- `400` - Invalid input data
- `500` - Server error

#### POST `/api/auth/logout`

Logout user and destroy session.

**Response:**
```json
{
    "success": true,
    "message": "Logout successful"
}
```

**Status Codes:**
- `200` - Logout successful
- `401` - Not authenticated
- `500` - Server error

#### GET `/api/auth/me`

Get current user information.

**Response:**
```json
{
    "success": true,
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "createdAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Status Codes:**
- `200` - User information retrieved
- `401` - Not authenticated
- `500` - Server error

### Cloud Credentials Endpoints

#### POST `/api/credentials`

Add cloud provider credentials.

**Request Body:**
```json
{
    "provider": "aws",
    "name": "Production AWS Account",
    "credentials": {
        "accessKeyId": "AKIA...",
        "secretAccessKey": "...",
        "region": "us-east-1"
    }
}
```

**Supported Providers:**
- `aws` - Amazon Web Services
- `azure` - Microsoft Azure
- `gcp` - Google Cloud Platform
- `oci` - Oracle Cloud Infrastructure

**Response:**
```json
{
    "success": true,
    "message": "Credentials added successfully",
    "credential": {
        "id": "uuid",
        "provider": "aws",
        "name": "Production AWS Account",
        "isValidated": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Status Codes:**
- `201` - Credentials added successfully
- `400` - Invalid input data
- `401` - Not authenticated
- `500` - Server error

#### GET `/api/credentials`

Retrieve all cloud credentials for the authenticated user.

**Response:**
```json
{
    "success": true,
    "credentials": [
        {
            "id": "uuid",
            "provider": "aws",
            "name": "Production AWS Account",
            "isValidated": true,
            "createdAt": "2024-01-01T00:00:00.000Z"
        },
        {
            "id": "uuid",
            "provider": "azure",
            "name": "Development Azure",
            "isValidated": false,
            "createdAt": "2024-01-01T00:00:00.000Z"
        }
    ]
}
```

**Status Codes:**
- `200` - Credentials retrieved successfully
- `401` - Not authenticated
- `500` - Server error

#### PUT `/api/credentials/:id`

Update cloud provider credentials.

**Request Body:**
```json
{
    "name": "Updated AWS Account",
    "credentials": {
        "accessKeyId": "AKIA...",
        "secretAccessKey": "...",
        "region": "us-west-2"
    }
}
```

**Response:**
```json
{
    "success": true,
    "message": "Credentials updated successfully",
    "credential": {
        "id": "uuid",
        "provider": "aws",
        "name": "Updated AWS Account",
        "isValidated": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Status Codes:**
- `200` - Credentials updated successfully
- `400` - Invalid input data
- `401` - Not authenticated
- `404` - Credentials not found
- `500` - Server error

#### DELETE `/api/credentials/:id`

Delete cloud provider credentials.

**Response:**
```json
{
    "success": true,
    "message": "Credentials deleted successfully"
}
```

**Status Codes:**
- `200` - Credentials deleted successfully
- `401` - Not authenticated
- `404` - Credentials not found
- `500` - Server error

### Inventory Endpoints

#### POST `/api/inventory/scan`

Start a cloud inventory scan.

**Request Body:**
```json
{
    "providers": ["aws", "azure", "gcp", "oci"],
    "credentials": [
        {
            "provider": "aws",
            "credentials": {
                "accessKeyId": "AKIA...",
                "secretAccessKey": "...",
                "region": "us-east-1"
            }
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "inventory": {
        "resources": [
            {
                "id": "i-1234567890abcdef0",
                "name": "web-server-01",
                "type": "t3.micro",
                "service": "AWS Compute",
                "region": "us-east-1",
                "state": "running",
                "costDetails": {
                    "type": "ec2-instance",
                    "hourlyCost": 0.0104
                }
            }
        ],
        "summary": {
            "totalResources": 1,
            "totalCost": 0.0104,
            "providers": ["aws"],
            "regions": ["us-east-1"],
            "services": ["AWS Compute"]
        },
        "scanMetadata": {
            "scanId": "uuid",
            "scanDate": "2024-01-01T00:00:00.000Z",
            "scanDuration": 5000,
            "providers": ["aws"]
        }
    }
}
```

**Status Codes:**
- `200` - Scan completed successfully
- `400` - Invalid input data
- `401` - Not authenticated
- `500` - Server error

#### GET `/api/inventory/scans`

Retrieve scan history for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of scans to return (default: 10)
- `offset` (optional): Number of scans to skip (default: 0)
- `provider` (optional): Filter by cloud provider

**Response:**
```json
{
    "success": true,
    "scans": [
        {
            "id": "uuid",
            "scanDate": "2024-01-01T00:00:00.000Z",
            "scanDuration": 5000,
            "providers": ["aws", "azure"],
            "totalResources": 25,
            "totalCost": 150.75
        }
    ],
    "pagination": {
        "total": 1,
        "limit": 10,
        "offset": 0,
        "hasMore": false
    }
}
```

**Status Codes:**
- `200` - Scans retrieved successfully
- `401` - Not authenticated
- `500` - Server error

#### GET `/api/inventory/scans/:id`

Retrieve detailed scan results.

**Response:**
```json
{
    "success": true,
    "scan": {
        "id": "uuid",
        "scanDate": "2024-01-01T00:00:00.000Z",
        "scanDuration": 5000,
        "providers": ["aws"],
        "resources": [
            {
                "id": "i-1234567890abcdef0",
                "name": "web-server-01",
                "type": "t3.micro",
                "service": "AWS Compute",
                "region": "us-east-1",
                "state": "running",
                "costDetails": {
                    "type": "ec2-instance",
                    "hourlyCost": 0.0104
                }
            }
        ],
        "summary": {
            "totalResources": 1,
            "totalCost": 0.0104,
            "providers": ["aws"],
            "regions": ["us-east-1"],
            "services": ["AWS Compute"]
        }
    }
}
```

**Status Codes:**
- `200` - Scan details retrieved successfully
- `401` - Not authenticated
- `404` - Scan not found
- `500` - Server error

### Cost Analysis Endpoints

#### POST `/api/cost/analyze`

Perform cost analysis based on requirements.

**Request Body:**
```json
{
    "requirements": {
        "compute": {
            "vcpus": 4,
            "memory": 8,
            "storage": 100,
            "operatingSystem": "linux"
        },
        "database": {
            "type": "managed",
            "size": "medium",
            "storage": 50
        },
        "networking": {
            "bandwidth": 1000,
            "loadBalancer": true
        },
        "region": "us-east-1",
        "currency": "USD"
    }
}
```

**Response:**
```json
{
    "success": true,
    "analysis": {
        "requirements": {
            "compute": {
                "vcpus": 4,
                "memory": 8,
                "storage": 100
            }
        },
        "results": {
            "aws": {
                "totalCost": 120.50,
                "breakdown": {
                    "compute": 80.00,
                    "database": 30.00,
                    "networking": 10.50
                },
                "recommendations": [
                    "Consider Reserved Instances for 30% savings",
                    "Use Spot Instances for non-critical workloads"
                ]
            },
            "azure": {
                "totalCost": 115.75,
                "breakdown": {
                    "compute": 75.00,
                    "database": 32.50,
                    "networking": 8.25
                }
            },
            "gcp": {
                "totalCost": 110.25,
                "breakdown": {
                    "compute": 70.00,
                    "database": 28.00,
                    "networking": 12.25
                }
            }
        },
        "cheapest": {
            "provider": "gcp",
            "cost": 110.25,
            "savings": 10.25
        },
        "analysisId": "uuid",
        "createdAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Status Codes:**
- `200` - Analysis completed successfully
- `400` - Invalid input data
- `401` - Not authenticated
- `500` - Server error

#### GET `/api/cost/analyses`

Retrieve cost analysis history.

**Query Parameters:**
- `limit` (optional): Number of analyses to return (default: 10)
- `offset` (optional): Number of analyses to skip (default: 0)

**Response:**
```json
{
    "success": true,
    "analyses": [
        {
            "id": "uuid",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "requirements": {
                "compute": {
                    "vcpus": 4,
                    "memory": 8
                }
            },
            "cheapestProvider": "gcp",
            "cheapestCost": 110.25,
            "totalProviders": 3
        }
    ],
    "pagination": {
        "total": 1,
        "limit": 10,
        "offset": 0,
        "hasMore": false
    }
}
```

**Status Codes:**
- `200` - Analyses retrieved successfully
- `401` - Not authenticated
- `500` - Server error

### Health Check Endpoints

#### GET `/api/health`

Check application health status.

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "services": {
        "database": "healthy",
        "redis": "healthy",
        "cloudApis": "healthy"
    }
}
```

**Status Codes:**
- `200` - Application is healthy
- `503` - Service unavailable

## 🔒 Error Handling

### Error Response Format

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": {
            "field": "email",
            "reason": "Invalid email format"
        }
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `AUTHENTICATION_REQUIRED` | 401 | User not authenticated |
| `INVALID_CREDENTIALS` | 401 | Invalid login credentials |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## 📊 Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Inventory endpoints**: 2 requests per minute per user
- **Cost analysis endpoints**: 10 requests per minute per user
- **Other endpoints**: 100 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔐 Security

### HTTPS

All API endpoints should be accessed over HTTPS in production.

### CORS

CORS is configured to allow requests from:
- `http://localhost:3000` (development)
- `https://your-domain.com` (production)

### Input Validation

All input data is validated and sanitized:
- Email format validation
- Password strength requirements
- SQL injection prevention
- XSS protection

### Session Security

- Sessions are HTTP-only and secure
- Session expiration after 24 hours of inactivity
- Automatic session cleanup

## 📝 Examples

### Complete Workflow Example

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }' \
  -c cookies.txt

# 3. Add AWS credentials
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider": "aws",
    "name": "Production AWS",
    "credentials": {
      "accessKeyId": "AKIA...",
      "secretAccessKey": "...",
      "region": "us-east-1"
    }
  }'

# 4. Run inventory scan
curl -X POST http://localhost:3000/api/inventory/scan \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "providers": ["aws"],
    "credentials": [
      {
        "provider": "aws",
        "credentials": {
          "accessKeyId": "AKIA...",
          "secretAccessKey": "...",
          "region": "us-east-1"
        }
      }
    ]
  }'

# 5. Perform cost analysis
curl -X POST http://localhost:3000/api/cost/analyze \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "requirements": {
      "compute": {
        "vcpus": 4,
        "memory": 8,
        "storage": 100
      },
      "region": "us-east-1"
    }
  }'
```

## 🧪 Testing

### Postman Collection

A Postman collection is available for testing the API:

1. Import `docs/postman/Cloud-Cost-Optimizer-API.postman_collection.json`
2. Set the base URL to your environment
3. Run the collection tests

### cURL Examples

All endpoints have cURL examples in the documentation above.

### API Testing Tools

- **Postman**: GUI-based API testing
- **Insomnia**: Alternative API client
- **curl**: Command-line testing
- **HTTPie**: User-friendly command-line client

## 📞 Support

For API-related issues:

1. **Check the error response** for detailed error information
2. **Verify authentication** is working correctly
3. **Review request format** matches the documentation
4. **Create a GitHub issue** with:
   - Request/response examples
   - Error messages
   - Steps to reproduce

**Contact Information**:
- Email: darbhasantosh11@gmail.com

