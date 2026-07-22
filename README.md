# Hauss Properties

A unified repository containing both the frontend and backend applications for the Hauss Properties project.

## Project Structure

```
Hauss Properties/
├── frontend/             # Frontend React + TypeScript application
└── backend/              # Node.js + Express backend application
```

## Getting Started

### Prerequisites

Make sure you have Node.js installed on your machine.

### Installation

To install dependencies for both the frontend and backend applications, run the following command from the root directory:

```bash
npm run install:all
```

### Environment Configuration

Configure the environment variables by creating `.env` files in their respective folders:

- **Frontend**: Check `frontend/.env` (replaces `home-sight-finder/.env`)
- **Backend**: Check `backend/.env`

### Development

To start both the frontend and backend development servers concurrently, run:

```bash
npm run dev
```

This will run:
- Frontend on Vite dev server (typically http://localhost:5173)
- Backend on nodemon (typically http://localhost:5000 or defined port)

Alternatively, you can run them individually:

- **Run Frontend only**: `npm run dev:frontend`
- **Run Backend only**: `npm run dev:backend`
