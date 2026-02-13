# InstantClaw

Your 24/7 Digital Employee Deployment Platform.

## Project Structure

- **web**: Next.js 14 Frontend (User Dashboard, Landing Page, Billing)
- **orchestrator**: Node.js/Express Backend (Manages Docker containers, API Keys)

## Getting Started

### Prerequisites
- Node.js 22+
- Docker (Running)
- Supabase Project (for DB & Auth)

### Setup

1.  **Frontend**:
    ```bash
    cd web
    npm install
    npm run dev
    ```

2.  **Backend**:
    ```bash
    cd orchestrator
    npm install
    npm run dev
    ```

## Architecture
See `implementation_plan.md` in the `brain` folder for detailed architecture.
