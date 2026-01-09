# Multi-Tenant AI Chat Platform

A comprehensive, production-ready multi-tenant AI chat platform with advanced authentication, authorization, RAG (Retrieval-Augmented Generation), and plugin system.

## 🎯 Features

### Authentication & Authorization
- **Dual API Key System**: Tenant keys (server-to-server) + User keys (end-user)
- **JWT Tokens**: Access tokens (1 day) + Refresh tokens (30 days)
- **Role-Based Access Control (RBAC)**: Flexible policy engine
- **Department/Subdepartment Scoping**: Fine-grained access control
- **BYO Key Support**: Users can bring their own API keys (stored in vault)

### Multi-User Chat
- **Multi-tenant**: Complete tenant isolation
- **Multi-user Chats**: Mix users from different departments
- **Message Visibility**: Public and private messages within chats
- **Access Scope**: RAG and tools respect message author's permissions

### RAG (Retrieval-Augmented Generation)
- **Vector Database**: Qdrant for semantic search
- **ACL per Chunk**: Every chunk has its own access scope
- **Document Versioning**: Track document changes over time
- **Multiple Formats**: PDF, DOCX, TXT, MD, and more
- **Hybrid Chunking**: Intelligent text segmentation

### Tools & Plugins
- **MCP Support**: Both process-based and HTTP-based Model Context Protocol
- **High-Risk Tool Approval**: Configurable approval workflow
- **Plugin Registry**: Database + filesystem loader
- **Per-Tenant Toggle**: Enable/disable plugins by tenant, department, role, or user

### Model Routing
- **Autonomous Selection**: Agent chooses best model within allowed set
- **Policy-Based Constraints**: Allowlist, budget, compatibility checks
- **Automatic Fallback**: Graceful degradation to alternative models
- **Budget Management**: Token and cost tracking per tenant and user

### Audit & Compliance
- **Comprehensive Logging**: All actions tracked
- **Immutable Audit Trail**: PostgreSQL-based
- **Never Log Secrets**: API keys stored in vault, never logged

## 🏗️ Architecture

Clean Architecture with clear separation of concerns:

```
src/
├── domain/              # Business logic & entities
│   ├── auth/           # AuthContext, PolicyEngine
│   ├── chat/           # ChatPermissions, Visibility
│   ├── rag/            # RagQuery, RagResult
│   └── plugins/        # PluginManifest, ToolCall
├── application/         # Use cases & ports (interfaces)
│   ├── ports/          # Repository & service interfaces
│   └── usecases/       # Business operations
├── infrastructure/      # External adapters
│   ├── auth/           # JWT, API Keys
│   ├── postgres/       # Prisma repositories
│   ├── qdrant/         # Vector database
│   ├── filestore/      # Local/S3 storage
│   ├── plugins/        # MCP adapters
│   ├── models/         # Model routing
│   └── audit/          # Audit logging
└── interfaces/          # HTTP API
    └── http/
        ├── middleware/ # Auth, error handling
        └── routes/     # REST endpoints
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Qdrant (optional, can use Docker)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd CHAT
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

5. **Start Qdrant (optional, for RAG)**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

6. **Run the application**
```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## 📋 API Endpoints

### Authentication

**POST /api/auth/token**
```json
{
  "grantType": "api_key",
  "apiKey": "your-api-key"
}
```

**POST /api/auth/refresh**
```json
{
  "refreshToken": "your-refresh-token"
}
```

### Chats

**POST /api/chats**
```json
{
  "title": "My Chat",
  "systemPrompt": "You are a helpful assistant",
  "settings": {
    "allowMultiUser": true,
    "allowPrivateMessages": true
  }
}
```

**POST /api/chats/:chatId/members**
```json
{
  "userId": "user-id",
  "role": "member"
}
```

**POST /api/chats/:chatId/messages**
```json
{
  "content": "Hello, world!",
  "visibility": "public",
  "useRag": true,
  "model": "opencode/big-pickle"
}
```

### RAG

**POST /api/rag/search**
```json
{
  "query": "What is the company policy?",
  "limit": 10,
  "filters": {
    "departments": ["engineering"],
    "tags": ["policy"]
  }
}
```

**POST /api/rag/documents**
```json
{
  "name": "Company Policy",
  "content": "base64-encoded-content",
  "format": "pdf",
  "tags": ["policy", "hr"],
  "department": "hr",
  "accessRoles": ["employee"]
}
```

## 🔒 Security Rules

### Hard Rules (Implemented)

1. **Chat Context Isolation**: Assistant can only access documents/tools that the message author can access
2. **Private Messages**: Only listed users/roles can see private messages
3. **BYO Keys**: Tenant and user keys stored in vault, audited but never logged
4. **High-Risk Tools**: Require approval from chat owner or higher role (dept_admin, tenant_admin)

### Policy Examples

```typescript
// Model Policy: Only allow free models for basic users
{
  type: 'model',
  scope: { roles: ['basic_user'] },
  rules: {
    allowedModels: ['opencode/minimax-m2.1-free']
  }
}

// Tool Policy: High-risk tools require approval
{
  type: 'tool',
  scope: { roles: ['*'] },
  rules: {
    requireApproval: true,
    approverRoles: ['chat_owner', 'dept_admin']
  }
}

// RAG Policy: Limit search results
{
  type: 'rag',
  scope: { departments: ['sales'] },
  rules: {
    maxResults: 5,
    allowedDepartments: ['sales', 'marketing']
  }
}
```

## 🗄️ Database Schema

See `prisma/schema.prisma` for the complete schema.

Key entities:
- **Tenant**: Multi-tenant isolation
- **User**: End users with roles, tags, department
- **Chat**: Multi-user chat rooms
- **Message**: Chat messages with visibility controls
- **Document**: RAG documents with versioning
- **Plugin**: Tool/plugin registry
- **Policy**: Access control policies
- **AuditLog**: Immutable audit trail

## 🔄 Migration Path

### Current: Windows Development
- Local PostgreSQL
- Local file storage
- MCP process plugins (with path/npx considerations)

### Future: Linux Production
- Dockerized services (API + PostgreSQL + Qdrant)
- S3 file storage
- Kubernetes deployment
- Vault for secrets management

To migrate, update:
1. `FILE_STORE_TYPE=s3` in `.env`
2. MCP plugin manifests (standardize `command` and `args`)
3. Dockerfiles and docker-compose.yml

## 📊 Monitoring & Observability

- Audit logs: Query via `/api/audit` endpoints
- Budget tracking: Token and cost usage per tenant/user
- Health check: `GET /health`

## 🧪 Testing

```bash
npm test
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📞 Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ using TypeScript, Prisma, Qdrant, and Express.
