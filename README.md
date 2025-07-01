# APISIX Frontend

This project is a frontend application built with React to provide a user interface for visualizing and editing information within an Apache APISIX instance. It aims to simplify the management of APISIX resources like Routes, Services, Upstreams, and Consumers by offering an intuitive and interactive dashboard.

This application will interact directly with the APISIX Admin API to perform its operations.

## Project Structure

The project will follow a standard React application structure to promote maintainability and scalability. Here's a general overview of the main directories:

```
apisix-frontend/
├── public/             # Static assets and HTML template
├── src/                # Application source code
│   ├── assets/         # Images, fonts, and other static assets
│   ├── components/     # Reusable UI components (buttons, forms, cards, etc.)
│   │   └── common/     # General-purpose common components
│   ├── layouts/        # Components that define the overall page structure (e.g., MainLayout)
│   ├── pages/          # Top-level page components (e.g., RoutesPage, ServicesPage)
│   ├── services/       # Modules for interacting with the APISIX Admin API
│   ├── store/          # State management (e.g., Redux, Zustand, or Context API)
│   │   ├── actions/
│   │   ├── reducers/
│   │   └── selectors/
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions and helpers
│   ├── config/         # Application configuration (API endpoints, etc.)
│   ├── App.js          # Main application component
│   ├── index.js        # Entry point of the application
│   └── setupTests.js   # Test setup
├── .gitignore          # Specifies intentionally untracked files that Git should ignore
├── package.json        # Project dependencies and scripts
└── README.md           # This file
```

**Key Directories:**

*   **`src/components/`**: Contains reusable UI elements. Components specific to a feature or page might be further organized into subdirectories.
*   **`src/pages/`**: Each file here typically represents a distinct view or page in the application (e.g., a page for managing APISIX Routes, another for Services).
*   **`src/services/`**: This directory will house the logic for making API calls to the APISIX Admin API. Each resource (Routes, Services, etc.) might have its own service file.
*   **`src/store/`**: If a global state management solution is used (like Redux or Zustand), its related files (actions, reducers, store configuration) will reside here. For simpler state management, React Context API might be used directly within relevant component trees.
*   **`src/hooks/`**: Custom React Hooks that encapsulate reusable logic.
*   **`src/utils/`**: Helper functions that can be used across the application (e.g., date formatting, data validation).
*   **`src/config/`**: Configuration files, such as the base URL for the APISIX Admin API.

## APISIX Admin API

The APISIX Admin API is a RESTful API that allows you to configure and manage your APISIX instance. This frontend application will use this API to perform all its operations.

**Key Concepts:**

*   **Routes:** Define how requests are matched and forwarded to upstream services. They can include matching rules based on URI, host, headers, methods, etc., and can have plugins attached.
*   **Services:** An abstraction for an API or a set of Route abstractions. Plugins and upstream configurations can be bound to a Service.
*   **Upstreams:** Represent a collection of backend service instances. APISIX load balances requests across these instances.
*   **Consumers:** Represent users or applications that consume your APIs. They are often used with authentication plugins.
*   **Plugins:** Allow you to add functionalities like authentication, rate limiting, logging, and transformations to your APIs.

**Authentication:**

All requests to the APISIX Admin API must include an API key in the `X-API-KEY` header. This key is defined in the APISIX configuration file (`config.yaml`).

**Default Address:**

By default, the Admin API listens on `http://127.0.0.1:9180/apisix/admin`.

**Example API Calls (using cURL):**

Below are some examples of common operations performed via the APISIX Admin API.

**1. Get a list of all Routes:**

```bash
curl http://127.0.0.1:9180/apisix/admin/routes -H 'X-API-KEY: your_api_key'
```

**2. Create a new Route:**

This example creates a route that matches requests with the URI `/myapi/*` and forwards them to an upstream service.

```bash
curl -X PUT http://127.0.0.1:9180/apisix/admin/routes/1 -H 'X-API-KEY: your_api_key' -d '{
    "uri": "/myapi/*",
    "upstream": {
        "type": "roundrobin",
        "nodes": {
            "backend-server1:8080": 1
        }
    }
}'
```
*   `PUT /apisix/admin/routes/{id}` is used to create or fully update a route with a specific ID.
*   `uri`: The path pattern to match incoming requests.
*   `upstream`: Defines the backend service(s) to forward requests to.
    *   `type: "roundrobin"`: Specifies the load balancing algorithm.
    *   `nodes`: A map of backend server addresses and their weights.

**3. Get a specific Service:**

```bash
curl http://127.0.0.1:9180/apisix/admin/services/my-service-id -H 'X-API-KEY: your_api_key'
```

**4. Create a new Service with a Plugin:**

This example creates a service and attaches a `key-auth` plugin to it.

```bash
curl -X PUT http://127.0.0.1:9180/apisix/admin/services/my-service-id -H 'X-API-KEY: your_api_key' -d '{
    "plugins": {
        "key-auth": {}
    },
    "upstream": {
        "type": "roundrobin",
        "nodes": {
            "service-backend:80": 1
        }
    }
}'
```
*   `plugins`: An object where keys are plugin names and values are their configurations.

**5. Create an Upstream:**

```bash
curl -X PUT http://127.0.0.1:9180/apisix/admin/upstreams/my-upstream -H 'X-API-KEY: your_api_key' -d '{
    "type": "roundrobin",
    "nodes": {
        "app-server1:3000": 1,
        "app-server2:3000": 1
    }
}'
```

**6. Create a Consumer:**

```bash
curl -X PUT http://127.0.0.1:9180/apisix/admin/consumers/user1 -H 'X-API-KEY: your_api_key' -d '{
    "username": "user1",
    "plugins": {
        "key-auth": {
            "key": "user1-secret-key"
        }
    }
}'
```
*   `username`: A unique identifier for the consumer.
*   The `key-auth` plugin is configured with a specific key for this consumer.

**Important Notes for Frontend Development:**

*   The frontend will need to allow users to input their APISIX Admin API base URL and `X-API-KEY`.
*   Error handling from API responses will be crucial for a good user experience.
*   The structure of request and response bodies for each resource type should be carefully handled.

For detailed information on all available endpoints and their parameters, refer to the [Official APISIX Admin API Documentation](https://apisix.apache.org/docs/apisix/admin-api/).
