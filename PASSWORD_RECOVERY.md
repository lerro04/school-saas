# Password Recovery Guide

This guide covers two methods to recover lost admin and general login credentials in the SchoolSaaS application.

## Method 1: CLI Command (Quick Recovery)

Use this method for immediate password reset via command line.

### Quick Reset

```bash
cd backend
php artisan user:reset-password your-email@example.com newpassword123
```

**Parameters:**
- `email` - The email address of the user account
- `password` - New password (minimum 8 characters)

**Example:**
```bash
php artisan user:reset-password admin@harare-high.ac.zw MyNewPassword123!
```

**Output:**
```
Password for admin@harare-high.ac.zw has been reset successfully!
```

### Requirements
- SSH/Terminal access to your server
- Laravel artisan CLI available
- Minimum password length: 8 characters

---

## Method 2: API Endpoints (Self-Service Password Reset)

Use these API endpoints to implement a self-service password recovery flow in your frontend.

### Step 1: Request Password Reset Token

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```json
{
  "email": "admin@harare-high.ac.zw",
  "tenant_id": "harare-high"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a password reset link will be sent.",
  "reset_token": "eyJhbGc..."
}
```

**Notes:**
- Returns success message regardless of whether email exists (for security)
- Token is valid for **1 hour**
- In production, this token should be sent via email (implement email service)
- Currently returns token in response for development/testing

---

### Step 2: Reset Password with Token

**Endpoint:** `POST /api/auth/reset-password`

**Request:**
```json
{
  "email": "admin@harare-high.ac.zw",
  "tenant_id": "harare-high",
  "token": "eyJhbGc...",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully. You can now login with your new password."
}
```

**Error Responses:**

Invalid/Expired Token:
```json
{
  "message": "Validation failed",
  "errors": {
    "token": ["Invalid or expired password reset token."]
  }
}
```

User Not Found:
```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["User not found."]
  }
}
```

---

### Step 3: Change Password (Authenticated Users)

Authenticated users can change their password without needing a reset token.

**Endpoint:** `POST /api/auth/change-password`

**Authorization:** Bearer Token required

**Request:**
```json
{
  "current_password": "OldPassword123",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password changed successfully."
}
```

**Error Response (Wrong Current Password):**
```json
{
  "message": "Validation failed",
  "errors": {
    "current_password": ["Current password is incorrect."]
  }
}
```

---

## Portal Password Recovery

Students, parents, and teachers can also recover their passwords using the portal endpoints:

- `POST /api/portal/forgot-password` - Request reset token
- `POST /api/portal/reset-password` - Reset with token
- `POST /api/portal/change-password` - Change authenticated user password

Same request/response format as admin endpoints above.

---

## Implementation Example (Frontend)

### React/JavaScript - Forgot Password Form

```javascript
async function handleForgotPassword(email, tenantId) {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tenant_id: tenantId })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Password reset token sent!');
      return data.reset_token; // Use in next step
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function handleResetPassword(email, tenantId, token, password) {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        tenant_id: tenantId,
        token,
        password,
        password_confirmation: password
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Password reset successful! You can now login.');
      // Redirect to login page
      navigate('/login');
    } else {
      alert(JSON.stringify(data.errors));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Security Best Practices

✅ **DO:**
- Enforce minimum 8-character passwords
- Use HTTPS for all password operations
- Implement rate limiting on password reset endpoints
- Send password reset tokens via email (not in response)
- Expire tokens after 1 hour
- Log password reset attempts for audit trail

❌ **DON'T:**
- Use the `/setup-tenant` route in production (commented out as of latest update)
- Share passwords via chat or email
- Store passwords in plain text
- Allow unlimited password reset attempts
- Reuse old passwords

---

## Next Steps

### Production Email Integration

Currently, the reset token is returned in the response. For production, implement email sending:

1. **Install Laravel Mail driver** (Mailgun, SendGrid, etc.)
2. **Create a Mailable class:**
   ```bash
   php artisan make:mail ResetPasswordMail
   ```
3. **Update `forgotPassword()` in AuthController:**
   ```php
   Mail::to($user->email)->send(new ResetPasswordMail($token));
   ```
4. **Remove `reset_token` from response** for security

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "User not found" | Verify email address and tenant ID are correct |
| "Invalid or expired token" | Request a new reset token (1 hour expiry) |
| "Password must be 8+ characters" | Use a longer password with mix of letters, numbers |
| Command not found | Ensure you're in `backend/` directory |
| "Tenant not found" | Verify tenant_id exists (e.g., `harare-high`) |

---

## Support

For issues or questions:
1. Check the [Laravel Authentication Docs](https://laravel.com/docs/authentication)
2. Review error messages carefully
3. Check application logs: `backend/storage/logs/`

