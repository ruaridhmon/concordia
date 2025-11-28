# AI Collaborative Intelligence

This project is a web application that facilitates collaborative intelligence using AI. It allows users to participate in Delphi-style rounds of questions and synthesizes the results.

## Project Structure

- `frontend/`: A React/Vite frontend application.
- `backend/`: A Python/FastAPI backend application.
- `docker-compose.yml`: For running the application with Docker.

## Getting Started

There are two ways to run this project: using Docker or running the frontend and backend separately.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (v3.10 or higher)
- [Docker](https://www.docker.com/) (optional)

### Configuration

1.  **Create a `.env` file:**

    In the root of the project, you will find a file named `.env.example`. Make a copy of this file and name it `.env`.

    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file:**

    Open the `.env` file and add your OpenRouter API key. The other variables should have sane defaults for local development.

    ```
    OPENROUTER_API_KEY="your-api-key"
    ```

### Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Backend Setup (if not using Docker):**

    -   Navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    -   Create a virtual environment:
        ```bash
        python3 -m venv .venv
        source .venv/bin/activate
        ```
    -   Install the dependencies:
        ```bash
        pip install -r requirements.txt
        ```

3.  **Frontend Setup (if not using Docker):**

    -   Navigate to the `frontend` directory:
        ```bash
        cd frontend
        ```
    -   Install the dependencies:
        ```bash
        npm install
        ```

### Running the Application

**With Docker:**

1.  Make sure you have created the `.env` file as described in the configuration instructions.
2.  Run the application using `docker-compose`:
    ```bash
    docker-compose up --build
    ```
    The application will be available at `http://localhost:3000`.

**Without Docker:**

1.  **Run the backend:**
    -   Navigate to the `backend` directory and run the application:
        ```bash
        uvicorn main:app --reload
        ```
        The backend will be running on `http://localhost:8000`.

2.  **Run the frontend:**
    -   Navigate to the `frontend` directory and run the application:
        ```bash
        npm run dev
        ```
        The frontend will be running on `http://localhost:5173`.

### Login

**Admin User:**

The admin user is created on application startup. You can configure the admin's email and password by creating a `.env` file in the `backend` directory.

`backend/.env`:
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-now
```

If you do not create a `.env` file, the application will use the default credentials:
-   **Email:** `admin@example.com`
-   **Password:** `change-me-now`

**Regular User:**

To log in as a regular user, you must first register for an account on the registration page. Regular user accounts must use an email formatted as ..@... (e.g., something@something).

## How to Use

1.  Register a new user account.
2.  Log in to the application.
3.  As an admin, you can create new forms with questions.
4.  As a user, you can access the forms and submit your responses.
5.  The application will guide you through the rounds of the Delphi method.
6.  After each round, the AI will synthesize the results.
