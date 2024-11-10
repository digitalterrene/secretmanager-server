# Secure Secret Generation Server

This server provides an API endpoint to generate a **deterministic secret** based on a user-supplied phrase and timestamp. The server applies several security measures, including rate-limiting, input validation, and hash stretching, to ensure that secret generation is both secure and reliable.

## Prerequisites

Before running the server, ensure you have the following:

- **Node.js** and **npm** installed on your machine.
- **dotenv** package for environment variable management.
- A `.env` file containing the `SECRET` key, which should be kept confidential.

## Installation

1. **Clone or Download the Project**

   ```bash
   git clone <https://github.com/digitalterrene/secretmanager-server.git>
   cd `src`
   ```

2. **Install Dependencies**
   Run the following command to install necessary dependencies:

   ```bash
   npm install
   ```

3. **Create a `.env` file**
   Inside the project directory, create a `.env` file and define the `SECRET` environment variable, which will be used for generating the secret.
   Example:

   ```
   SECRET=my-secure-server-side-secret
   PORT=4000
   ```

4. **Run the Server**
   Start the server using the following command:

   ```bash
   npm start
   ```

   The server will be running on the port specified in the `.env` file (`PORT`), and you can now make API requests.

---

## API Endpoints

### POST `/generate-secret`

This endpoint generates a secret based on a user-supplied **phrase** and **timestamp**. The server validates the inputs, applies hashing, and returns a deterministic secret.

#### Request Format

- **Method**: POST
- **Endpoint**: `/generate-secret`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "phrase": "strongphrase",
    "timestamp": "1731255347375"
  }
  ```

#### Request Body Parameters

- **phrase** (string, required): A strong password phrase that must contain at least one uppercase letter, one lowercase letter, one number, and one special character.
- **timestamp** (string, required): A valid Unix timestamp in milliseconds (13 digits).

#### Response Format

- **Status Code**: 200 (OK) if successful.
- **Body**:

  ```json
  {
    "secret": "<deterministic-secret>"
  }
  ```

- **Status Code**: 400 (Bad Request) if inputs are invalid.
- **Body**:
  ```json
  {
    "error": "Invalid input. Check phrase, and timestamp."
  }
  ```

#### Example Request

```bash
curl -X POST http://localhost:4000/generate-secret \
-H "Content-Type: application/json" \
-d '{"phrase": "b@Sesfhgjk1", "timestamp": "1731255347375"}'
```

#### Example Response

```json
{
  "secret": "3fcf2bbfa2c60222039de129fb0d50968844f35114ad16eb40be68c19fdfdcaf"
}
```

---

## Security Features

1. **Rate Limiting**

   - The server uses rate limiting to protect against excessive requests from a single IP address.
   - The rate limit is set to 100 requests per 15 minutes.

2. **Input Validation**

   - The `phrase` must meet certain complexity requirements, including:
     - At least one uppercase letter (`A-Z`).
     - At least one lowercase letter (`a-z`).
     - At least one digit (`0-9`).
     - At least one special character (`@$!%*?&`).
   - The `timestamp` must be a valid 13-digit Unix timestamp in milliseconds.

3. **Hash Stretching**
   - To further secure the generated secret, **hash stretching** is applied. The server uses HMAC-SHA256 to hash the combination of the `phrase`, `timestamp`, and `SERVER_SECRET` multiple times (10,000 iterations by default).
   - This makes the process computationally expensive for attackers, making brute-force attempts more difficult.

---

## Configuration

The following parameters can be configured via environment variables:

- **SECRET**: The server-side secret, which must remain constant and confidential. This is used in conjunction with the `phrase` and `timestamp` to generate the secret.
- **PORT**: The port the server will listen on. Default is `4000`.
- **STRETCH_COUNT**: The number of hash iterations for secret generation. Default is `10000`. This can be increased for additional security.

To configure, update the `.env` file in the project directory:

```
SECRET = test
PORT = 4000
STRETCH_COUNT=10000
```

---

## Rate Limiting

- The rate limiting is set to allow **100 requests per IP** within a **15-minute window**. If the limit is exceeded, the server will respond with a `429 Too Many Requests` status code and a message:
  ```json
  {
    "message": "Too many requests, please try again later."
  }
  ```

---

## Error Handling

- **400 Bad Request**: Occurs when the `phrase` or `timestamp` is invalid or does not meet the required format.
- **429 Too Many Requests**: Occurs when the rate limit is exceeded.

---

## Security Considerations

1. **Environment Variables**: Keep the `SECRET` confidential and do not expose it in your codebase. Use environment variables to manage sensitive information.
2. **Hashing and Salt**: The server uses hash stretching (HMAC with SHA-256) to secure the secret generation process, which is computationally intensive to prevent brute-force attacks.
3. **Rate Limiting**: The rate limiting helps mitigate automated attacks by restricting the number of requests an IP can make within a time frame.

---
