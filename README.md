# coregraph

a graph-based context service with real-time capabilities

## features

### core platform

- 🧠 **graph memory** - relationship-based memory storage
- 🔄 **event system** - real-time event processing
- 🔒 **auth** - jwt-based authentication
- 📊 **rate limiting** - request throttling
- 💾 **mock mode** - development with mock data

### tech stack

- ⚡ **fastify** - high performance web framework
- 🗄️ **supabase** - postgresql + real-time
- 📦 **redis** - caching and rate limiting
- 🔑 **jwt** - authentication
- 🧪 **tap** - testing framework
- 💳 **stripe** - payment processing
- 📨 **svix** - webhook handling

## getting started

1. clone and install:

```bash
git clone https://github.com/yourusername/coregraph.git
cd coregraph
npm install
```

2. set up environment:

```bash
cp .env.example .env
```

3. start development (with mock mode):

```bash
npm run dev
```

## architecture

### core concepts

- **graph storage** - nodes and edges with properties
- **real-time events** - pub/sub system for updates
- **caching** - redis for performance
- **auth** - jwt with role-based access
- **mock mode** - development without dependencies

### plugins

- **auth.js** - jwt authentication and session management
- **redis.js** - caching and rate limiting with mock support
- **supabase.js** - graph storage with mock support
- **rateLimit.js** - request throttling
- **errorHandler.js** - consistent error responses

### services

- **graphEngine** - core graph operations and queries
- **paymentService** - stripe payment processing

### routes

- **authRoutes** - authentication and session endpoints
- **graphRoutes** - graph crud operations
- **paymentRoutes** - payment processing endpoints

## project structure

```
├── src/
│   ├── plugins/        # fastify plugins
│   │   ├── auth.js     # jwt auth
│   │   ├── redis.js    # redis/mock
│   │   └── supabase.js # db/mock
│   ├── routes/         # api routes
│   ├── services/       # business logic
│   └── server.js       # entry point
├── test/              # test files
└── .env              # configuration
```

## api endpoints

### auth

- `POST /api/auth/login` - get jwt token
- `GET /api/auth/session` - validate session
- `POST /api/auth/webhook` - auth events

### graph

- `POST /api/nodes` - create node
- `GET /api/nodes` - query nodes
- `POST /api/edges` - create edge
- `GET /api/edges` - query edges

### payment

- `POST /api/payment/create` - create payment intent
- `POST /api/payment/webhook` - handle stripe events

## development

### mock mode

set `MOCK_DB=true` in `.env` to use mock implementations

### testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

### environment variables

```env
# required
PORT=3000
JWT_SECRET=your-secret-key

# optional (for mock mode)
MOCK_DB=true

# required for production
REDIS_HOST=localhost
REDIS_PORT=6379
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-key
STRIPE_SECRET_KEY=your-key
```

## deployment

### docker

```bash
docker build -t coregraph .
docker run -p 3000:3000 coregraph
```

### production checklist

- [ ] set up proper secrets management
- [ ] configure rate limiting
- [ ] enable ssl/tls
- [ ] set up monitoring
- [ ] configure backups
- [ ] implement ci/cd

## license

mit
