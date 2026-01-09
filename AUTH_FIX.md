# Authentication Fix - TENANT vs USER API Keys

## 🔍 Problem Identified

The error **"User must be authenticated to create a chat"** occurs when you try to create a chat using a **TENANT API key** instead of a **USER API key**.

### Root Cause

The authentication system has two types of API keys:

1. **TENANT API Key** - For server-to-server communication
   - Located in: `Tenant` table, `apiKey` column
   - JWT payload: `{ tenantId: "xxx", userId: undefined }`
   - Use case: Backend services communicating without user context

2. **USER API Key** - For user authentication
   - Located in: `User` table, `apiKey` column
   - JWT payload: `{ tenantId: "xxx", userId: "yyy", roles: [...], ... }`
   - Use case: Frontend authentication with full user context

When you authenticate with a TENANT API key, the JWT token doesn't contain a `userId`, which causes `CreateChat.execute()` to fail at line 26:

```typescript
if (!ctx.userId) {
  throw new Error(
    'User must be authenticated to create a chat. ' +
    'You are using a TENANT API key which does not have user context. ' +
    'Please use a USER API key instead.'
  );
}
```

## ✅ Solution

### For Frontend Authentication

Always use the **USER API key** when authenticating from the frontend:

```typescript
// ❌ WRONG - Using tenant API key
const response = await api.post('/auth/token', {
  apiKey: 'sk_abc123...', // This is a tenant key!
  grantType: 'api_key'
});

// ✅ CORRECT - Using user API key
const response = await api.post('/auth/token', {
  apiKey: 'sk_def456...', // This is a user key!
  grantType: 'api_key'
});
```

### How to Get the Correct API Key

When you run the setup script, it creates both keys:

```bash
npm run setup
```

Output:
```
✅ Setup complete!

Tenant API Key: sk_abc123...  ← DON'T use this in frontend
User API Key: sk_def456...    ← USE this in frontend

Login Credentials:
  Email: admin@example.com
  Password: admin123
  User API Key: sk_def456...
```

**Important:** Use the **User API Key** (the second one) for frontend authentication!

## 🧪 Testing the Fix

### Option 1: Run the Test Script

```bash
# Make sure Docker is running with the database
docker-compose up -d postgres

# Run the test script
chmod +x test-auth.sh
./test-auth.sh
```

This script will:
1. Extract both API keys from the database
2. Test authentication with TENANT key (will fail to create chat)
3. Test authentication with USER key (will succeed)

### Option 2: Manual Testing with curl

**Step 1: Get your User API key**
```bash
# If you used the setup script, check the output
# OR query the database:
docker exec chat-postgres psql -U chatuser -d chat_platform -c "SELECT email, api_key FROM \"User\";"
```

**Step 2: Get JWT token with USER API key**
```bash
USER_API_KEY="your-user-api-key-here"

curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$USER_API_KEY\",
    \"grantType\": \"api_key\"
  }"
```

**Step 3: Create a chat with the JWT token**
```bash
ACCESS_TOKEN="the-token-from-step-2"

curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "My First Chat",
    "systemPrompt": "You are a helpful assistant."
  }'
```

## 📊 Debugging Logs

The fix includes comprehensive logging to help diagnose authentication issues:

### IssueToken Logs
When you request a token, you'll see:
```
[IssueToken] API Key validated: {
  type: 'tenant',  // or 'user'
  tenantId: 'xxx',
  userId: '(none - tenant key)'  // or actual user ID
}
```

### Auth Middleware Logs
When making authenticated requests:
```
[2026-01-09T...] POST /api/chats
Headers: {
  content-type: 'application/json',
  authorization: 'Bearer ***'
}
[AUTH] Request to: POST /api/chats
[AUTH] Has Auth Header: true
[AUTH] Token validated: { type: 'access', tenantId: 'xxx', userId: 'yyy' }
[AUTH] AuthContext created: {
  tenantId: 'xxx',
  userId: 'yyy',
  roles: ['admin']
}
```

If you see `userId: undefined` in the AuthContext, you're using a TENANT API key!

## 🔧 Frontend Configuration

Update your frontend authentication to use the USER API key:

**frontend/src/lib/api.ts** (or wherever you handle login)
```typescript
// Store the USER API key (not tenant key!)
const USER_API_KEY = 'sk_your_user_api_key_here';

export async function login() {
  const response = await api.post('/auth/token', {
    apiKey: USER_API_KEY,  // ← User API key
    grantType: 'api_key'
  });

  const { accessToken, refreshToken } = response.data;

  // Store tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  return response.data;
}
```

## 📝 Summary

| Aspect | TENANT API Key | USER API Key |
|--------|---------------|--------------|
| **Purpose** | Server-to-server | User authentication |
| **userId in JWT** | ❌ undefined | ✅ Defined |
| **Can create chats** | ❌ No | ✅ Yes |
| **Has roles** | ❌ No | ✅ Yes |
| **Frontend usage** | ❌ Don't use | ✅ Use this |

## 🚀 Quick Fix Checklist

- [ ] Run `npm run setup` to create tenant and user
- [ ] Copy the **User API Key** (second key in output)
- [ ] Update frontend to use the User API Key
- [ ] Clear browser localStorage/cookies
- [ ] Login again with the User API Key
- [ ] Try creating a chat - should work now! ✅

## 📚 Related Files

- `src/application/usecases/CreateChat.ts:26` - Where the error is thrown
- `src/application/usecases/IssueToken.ts:45` - API key type logging
- `src/infrastructure/auth/JwtAuth.ts:18` - API key validation logic
- `src/interfaces/http/middleware/auth.middleware.ts` - Authentication middleware with debugging
- `scripts/setup.ts` - Creates tenant and user with their API keys

---

**Need Help?**
Check the server logs - they now show detailed authentication flow including which type of API key is being used!
