<h1 align="center">🌐 Respy Tech API 🚀</h1>

<p align="center">
  <img src="https://i.pinimg.com/736x/be/6a/a9/be6aa924c77729d5d347be9ed8434142.jpg" alt="Respy Tech Logo">
</p>

<h2 align="center"><u>LLM API Server for Local Hosting</u></h2>

<p align="center">Multiple LLM API Access Using Express.js</p>

<p align="center">
  <em>🚀 Made by a weeb who likes a girl-deer and Koshi-tan 🛠️</em>
</p>
<p align="center">
  <em>Not properly made for production usage. This project is for fun (mostly for myself to just use a single API endpoint for my projects)</em>
</p>

<p align="center">
  <a href="https://discordapp.com/users/188610034849021952">
    <img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
  </a>
  <a href="https://mysupport.razer.com/app/answers/detail/a_id/3683/~/razer-blade-15%E2%80%9D-advanced-%282019%29-%7C-rz09-0301x-support-%26-faqs">
    <img src="https://img.shields.io/badge/razer%20laptop-44D62D?style=for-the-badge&logo=razer&logoColor=252525" alt="Razer Laptop">
  </a>
  <a href="https://platform.openai.com/">
    <img src="https://img.shields.io/badge/ChatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white" alt="ChatGPT">
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  </a>
  <a href="https://axios-http.com/docs/intro">
    <img src="https://img.shields.io/badge/axios-671ddf?&style=for-the-badge&logo=axios&logoColor=white" alt="Axios">
  </a>
</p>

<p align="center">
  <strong>You can also access the API directly at: <a href="https://api.respy.tech/">https://api.respy.tech/</a></strong>
</p>
<p align="center">
  <small><em>Note: To access the API, you must follow the instructions shown at the root endpoint.</em></small>
</p>

---

## Table of Contents

- [🌟 Features](#-features)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Key Saving](#key-saving)
  - [Models Set-Up](#models-set-up)
  - [Running the Server](#running-the-server)
- [🛠️ API Endpoints](#️-api-endpoints)
- [🧪 Running Tests](#-running-tests)
- [🎨 Design Philosophy](#-design-philosophy)
- [📄 License](#-license)
- [📞 Support](#-support)
- [📜 Changelog](#-changelog)

---

## 🌟 Features

- **Multi-Provider Support:** Seamlessly connect to multiple language model providers, including OpenAI, Anthropic, Google, Mistral, Cohere, and even Custom Provider.
- **Premium and Free Models:** Setup and manage both premium and free models with flexible configuration.
- **Streaming and Non-Streaming Responses:** Experience real-time or batch responses from the API, with support for both streaming and non-streaming modes.
- **Rate Limiting:** Prevent abuse with built-in rate limiting on requests, using express-rate-limit and rate-limiter-flexible.
- **Health Check Endpoint:** Ensure the API is always running smoothly with a dedicated health check endpoint and Discord notifications.
- **Function Call Handling:** Execute specific functions based on the model's response, with support for custom function definitions.
- **Clustering:** Enhance performance and scalability with Node.js clustering, automatically utilizing multiple CPU cores.
- **Detailed Logging:** Comprehensive logging of requests, responses, and performance metrics using Winston and chalk for colorized output.
- **Honeypot:** Implement a honeypot system to enhance security by detecting and handling suspicious requests.
- **API Key Authentication:** Secure access with API key validation, supporting both local storage and DigitalOcean Spaces for key management or any custom remote storage.
- **CORS Configuration:** Flexible CORS setup to control access from different origins.
- **Error Handling:** Robust error handling and reporting throughout the application.
- **Environment Configuration:** Easy configuration using environment variables for sensitive information and deployment settings.
- **Model Configuration:** Flexible model configuration system allowing easy addition and management of new models.
- **Request Sanitization:** Input sanitization to prevent malicious or erroneous data from affecting the system.
- **Performance Monitoring:** Built-in performance monitoring for API requests and responses.
- **Extensible Architecture:** Modular design allowing easy addition of new features and providers.

Limitations:
- You are limited to only models that supports `/v1/chat/completions` endpoint.
- In the future, more accessible endpoint will be added (until I feel like I want them).

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm :3

### Installation

Clone the repository and navigate into the directory:
```bash
git clone https://github.com/rimunace/respy-tech-api.git
cd respy-tech-api
```

Install dependencies:

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
# Example environment variables

# Setup IP and PORT
IP=
PORT=3000

# DISCORD WEBHOOK URL
# You can setup a Discord webhook URL to check "/health" endpoint
DISCORD_WEBHOOK_URL=

# CORS SETUP
# You can set-up a CORS origin to allow only certain origins
ALLOWED_ORIGINS=https://domain.com,https://domain2.com

# API-Server Key SETUP

# Store your Key in DigitalOcean Spaces
# If you prefer to use other storage, make sure to change the code in:
# src/middleware/authMiddleware.ts

# You can also opt to leave this empty and use local key saving

DO_SPACES_ENDPOINT=
DO_SPACES_REGION=
DO_SPACES_BUCKET=
DO_SPACES_ACCESS_KEY_ID=
DO_SPACES_SECRET_ACCESS_KEY=

# Setup API Key
openai=your_openai_api_key
anthropic=your_anthropic_api_key
google=your_google_api_key

# ... // Add more API keys as needed
```

### API Key System
This API will not work without an API key. 

If you prefer to use local key saving, you can set-up the following folder structure:
```
root
|-- key
    |-- API-KEY-1.json
    |-- API-KEY-2.json
    |-- ...
```

Make sure your key is saved as the `<API-KEY>.json>` with the following format:
```json
{
    "id": "API-KEY",
    "premium": false, // Set to true if the key is for premium models
    "generated": "04/08/2024" // Date of key generation
}
```
The format for using DigitalOcean Spaces is the same as above.

If you want to automatically generate a key, too bad I don't have the time to implement that... :P

## ⚙️ Models Set-Up

To configure your models, follow these steps:

1. **Navigate to the Configuration File:**
   Go to the `models/config-example.json` file in your project directory.

2. **Edit the Configuration:**
   Update the file with your desired model details. Below is an example configuration:

   ```json
   {
       "type": "list",
       "models": [
           {
               "id": "gpt-3.5-turbo", // Your model id
               "name": "GPT-3.5 Turbo", // Your model name
               "owned_by": "openai", // Who owns this model
               "premium": false // Should only premium members access this model
           },
           {
               // ...Add more models as needed
           }
       ]
   }
   ```

3. **Save the File:**
   Ensure you save the changes and rename file to `config.json`.

4. **Add More Models:**
   You can add more models by following the structure provided in the example.

Once your model is set-up, you need to set-up your providers by following the steps below:

1. **Navigate to the Configuration File:**
   Go to the `providers/chat-completions-example.json` file in your project directory.

2. **Edit the Configuration:**
   Update the file to your provider's format:
   ```json
   {
    "providers": [
      {
        "name": "openai",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "models": {
          "gpt-3.5-turbo": "gpt-3.5-turbo",
          "gpt-4": "gpt-4",
          "gpt-4-turbo": "gpt-4-turbo-preview"
        }
      },
      {
        "name": "anthropic",
        "endpoint": "https://api.anthropic.com/v1/messages",
        "models": {
          "claude-3-opus-20240229": "claude-3-opus-20240229"
        }
      }
      // ...Add more providers as needed
    ]
   }
   ```
   *Note: You need to save the provider's API key in `.env` file as the variable name is the same as the provider's name.*

3. Save the file and rename it to `chat-completions.json`.
4. Add more providers by following the same structure as the example above.


### Running the Server

To build the project and run, execute:

```bash
npm run build
npm start
```

The API service uses clustering to enhance performance and scalability.

## 🛠️ API Endpoints

### 1. Chat Completions

- **Endpoint:** `/v1/chat/completions`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }
  ```

### 2. List Models

- **Endpoint:** `/v1/models`
- **Method:** `GET`
- **Response:**
  ```json
  [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "owned_by": "openai",
      "premium": false
    },
  ]
  ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 📞 Support

For any inquiries or support, feel free to reach out via [contact@respy.tech](mailto:contact@respy.tech) or [Discord: respire](https://discordapp.com/users/188610034849021952). 

---

Happy coding! 🎉