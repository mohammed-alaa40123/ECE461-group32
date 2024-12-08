# ECE 461 - Fall 2024 - Project Phase 2: Trustworthy Module Registry

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Package Management](#package-management)
  - [Package Ratings](#package-ratings)
- [Usage](#usage)
  - [Using Postman](#using-postman)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Project Overview

**ECE 461 - Fall 2024 - Project Phase 2** presents a **Trustworthy Module Registry**, an API-driven service designed to manage software packages effectively. This registry facilitates operations such as creating, retrieving, updating, deleting, and searching for packages. It ensures data integrity, supports pagination, and provides comprehensive package ratings to aid users in evaluating package quality.

## Features

- **Authentication:** Secure access using JWT-based tokens.
- **Package Management:** Create, retrieve, update, and delete packages with unique identifiers.
- **Pagination Support:** Efficiently handle large datasets with offset-based pagination.
- **Search Functionality:** Search packages using regular expressions.
- **Package Ratings:** Comprehensive scoring system evaluating various aspects of packages.
- **Error Handling:** Consistent and meaningful HTTP status codes for better client-side handling.
- **Logging:** Enhanced monitoring and debugging through detailed logs.
- **Database Integration:** Robust interaction with PostgreSQL for data persistence.
- **GitHub Integration:** Fetch and process repository information from GitHub URLs.

## Architecture

The project leverages **AWS Lambda** functions to handle API requests, ensuring scalability and efficient resource utilization. Key components include:

- **API Gateway:** Manages and routes incoming HTTP requests to appropriate Lambda handlers.
- **PostgreSQL Database:** Stores package metadata, ratings, and history.
- **AWS S3:** (Optional) For storing package content if needed.
- **Helper Modules:** Facilitate operations like GitHub repository information fetching, logging, and metrics calculations.

[Architecture Diagram and Plan](https://drive.google.com/file/d/1-B_BJKH-HF2FismHCk340Z5jAGJi-wbi/view?usp=sharing) <!-- Replace with actual diagram if available -->

## Getting Started

### Prerequisites

- **Node.js** (v14.x or later)
- **npm** (v6.x or later)
- **PostgreSQL** Database
- **AWS Account** with permissions to deploy Lambda functions and API Gateway
- **GitHub Account** (for repository access and integration)

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/mohammed-alaa40123/ECE461-group32
   cd trustworthy-module-registry
   ```

2. **Install Dependencies:**

   ```bash
   cd backend/src
   npm install serverless
   npm install
   ```

3. **Environment Configuration:**

   Create a `.env` file in the root directory and configure the necessary environment variables:

   ```env
   DATABASE_URL=your_postgresql_database_url
   GITHUB_TOKEN=your_github_access_token
   JWT_SECRET=your_jwt_secret
   AWS_REGION=your_aws_region
   S3_BUCKET=your_S3_bucket
   RDS_HOST= your_RDS_HOST
   RDS_USER= your_RDS_host
   RDS_PASSWORD= your_RDS_ppassword
   RDS_DATABASE= your_RDS_DATABASE
   RDS_PORT= your_RDS_PORT
   ```

### Configuration

Ensure that the PostgreSQL database is set up with the required schemas and tables. Update the `ECE 461 - Fall 2024 - Project Phase 2-front-oas30-postman.yaml` file as needed to reflect any changes in the API specifications.

## API Documentation

The API adheres to the **OpenAPI 3.0.1** specification, ensuring clear and structured documentation. Below is a summary of the primary endpoints and their functionalities.

### Authentication

#### Create Authentication Token

- **Endpoint:** `/authenticate`
- **Method:** `PUT`
- **Description:** Generates a JWT token for authenticated access.
- **Request Body:**

  ```json
  {
    "username": "your_username",
    "password": "your_password"
  }
  ```

- **Responses:**
  - `200 OK`: Returns the authentication token.
  - `400 Bad Request`: Missing or invalid fields.
  - `403 Forbidden`: Authentication failed.

### Package Management

#### Create a New Package

- **Endpoint:** `/packages`
- **Method:** `POST`
- **Description:** Creates and processes a new package.
- **Headers:**
  - `X-Authorization`: Your authentication token.
- **Request Body:**

  ```json
  {
    "metadata": {
      "Name": "packageName",
      "Version": "1.0.0",
      "ID": "unique_package_id",
      "Owner": "owner_name"
    },
    "data": {
      "Content": "package_content",
      "JSProgram": "javascript_program_code"
    }
  }
  ```

- **Responses:**
  - `200 OK`: Package created successfully.
  - `400 Bad Request`: Missing `metadata` or `data`.
  - `403 Forbidden`: Insufficient permissions.
  - `409 Conflict`: Package already exists.
  - `500 Internal Server Error`: Server-side error.

#### Retrieve a Package

- **Endpoint:** `/package/{id}`
- **Method:** `GET`
- **Description:** Retrieves details of a specific package by its ID.
- **Headers:**
  - `X-Authorization`: Your authentication token.
- **Responses:**
  - `200 OK`: Returns package details.
  - `404 Not Found`: Package does not exist.
  - `500 Internal Server Error`: Server-side error.

#### Update a Package

- **Endpoint:** `/package/{id}`
- **Method:** `PUT`
- **Description:** Updates information of an existing package.
- **Headers:**
  - `X-Authorization`: Your authentication token.
- **Request Body:**

  ```json
  {
    "metadata": {
      "Name": "updatedPackageName",
      "Version": "1.1.0",
      "ID": "unique_package_id",
      "Owner": "updated_owner_name"
    },
    "data": {
      "Content": "updated_package_content",
      "JSProgram": "updated_javascript_program_code"
    }
  }
  ```

- **Responses:**
  - `200 OK`: Package updated successfully.
  - `400 Bad Request`: Missing `metadata` or `data`, or mismatch in ID.
  - `403 Forbidden`: Insufficient permissions.
  - `404 Not Found`: Package does not exist.
  - `409 Conflict`: Package with updated details already exists.
  - `500 Internal Server Error`: Server-side error.

#### Delete a Package

- **Endpoint:** `/package/{id}`
- **Method:** `DELETE`
- **Description:** Deletes a package by its ID.
- **Headers:**
  - `X-Authorization`: Your authentication token.
- **Responses:**
  - `200 OK`: Package deleted successfully.
  - `403 Forbidden`: Insufficient permissions.
  - `404 Not Found`: Package does not exist.
  - `500 Internal Server Error`: Server-side error.

#### List Packages

- **Endpoint:** `/packages`
- **Method:** `POST`
- **Description:** Lists packages based on query parameters with pagination support.
- **Headers:**
  - `X-Authorization`: Your authentication token.
- **Query Parameters:**
  - `offset` (optional): For pagination.
- **Request Body:**

  ```json
  [
    {
      "name": "packageName",
      "version": "1.0.0"
    }
  ]
  ```

- **Responses:**
  - `200 OK`: Returns a list of packages with pagination offset.
  - `400 Bad Request`: Missing or invalid query parameters.
  - `403 Forbidden`: Insufficient permissions.
  - `413 Payload Too Large`: Too many packages returned.
  - `500 Internal Server Error`: Server-side error.

### Package Ratings

#### Get Package Rating

- **Endpoint:** `/package/{id}/rate`
- **Method:** `GET`
- **Description:** Retrieves the rating of a specific package.
- **Headers:**
  - `X-Authorization`: Your authentication token.
- **Responses:**
  - `200 OK`: Returns package rating details.
  - `403 Forbidden`: Authentication failed.
  - `404 Not Found`: Package does not exist.
  - `500 Internal Server Error`: Server-side error.

## Usage

### Using Postman

To interact with the API endpoints effectively, you can use **Postman**. Below is a guide to configure and send requests using Postman.

#### Adding the `offset` Parameter in Postman for a POST Request

1. **Open Postman and Create a New Request:**
   - Click on the **"New"** button and select **"Request"**.
   - Name your request (e.g., `List Packages`) and choose a collection to save it in.

2. **Set the Request Method and URL:**
   - Set the request method to **POST**.
   - Enter the endpoint URL, for example:
     ```
     https://zy5br6rkxd.execute-api.us-east-1.amazonaws.com/front/packages
     ```

3. **Add the `offset` Query Parameter:**
   - Click on the **"Params"** tab located below the URL field.
   - In the key-value table, add a new parameter:
     - **Key:** `offset`
     - **Value:** `3` *(or your desired offset value)*

   ![Postman Params Tab](./docs/postman-params.png) <!-- Replace with actual screenshot -->

4. **Set Up the Request Body:**
   - Click on the **"Body"** tab.
   - Select **"raw"** and choose **"JSON"** from the dropdown.
   - Enter the JSON array as per your API specification. For example:
     ```json
     [
       {
         "name": "*",
         "version": "1.0.0"
       }
     ]
     ```

5. **Add Required Headers:**
   - Click on the **"Headers"** tab.
   - Add the `X-Authorization` header:
     - **Key:** `X-Authorization`
     - **Value:** `your-authentication-token`

   ![Postman Headers Tab](./docs/postman-headers.png) <!-- Replace with actual screenshot -->

6. **Send the Request:**
   - Review all the settings to ensure correctness.
   - Click the **"Send"** button to execute the request.
   - Inspect the response in the lower pane to verify the results.

#### Example Request Summary

- **Method:** POST
- **URL:** `https://zy5br6rkxd.execute-api.us-east-1.amazonaws.com/front/packages`
- **Params:**
  | Key    | Value |
  |--------|-------|
  | offset | 3     |
- **Headers:**
  | Key             | Value                     |
  |-----------------|---------------------------|
  | X-Authorization | your-authentication-token |
- **Body (JSON):**
  ```json
  [
    {
      "name": "*",
      "version": "1.0.0"
    }
  ]
  ```

## Technologies Used

- **AWS Lambda:** Serverless functions handling API requests.
- **API Gateway:** Managing and routing HTTP requests.
- **PostgreSQL:** Relational database for storing package data.
- **TypeScript:** Enhancing JavaScript with static typing.
- **Node.js:** Server-side runtime environment.
- **dotenv:** Managing environment variables.
- **jsonwebtoken:** Handling JWT authentication.
- **bcrypt:** Securing passwords through hashing.
- **p-limit:** Controlling concurrency in file operations.
- **Prettier:** Code formatting tool.
- **AdmZip:** Handling ZIP file operations.
- **AWS SDK:** Interacting with AWS services.
- **Postman:** API testing and documentation.

## Project Structure

```
trustworthy-module-registry/
├── src/
│   ├── handlers/
│   │   ├── handlers.ts
│   │   └── handlerhelper.ts
│   ├── services/
│   │   └── dbService.ts
│   ├── rating/
│   │   ├── processURL.ts
│   │   ├── logger.ts
│   │   └── metrics/
│   │       └── netScore.ts
│   ├── utils/
│   │   └── response.ts
│   ├── index.ts
│   └── ...other modules
├── tests/
│   └── ...test files
├── ECE 461 - Fall 2024 - Project Phase 2-front-oas30-postman.yaml
├── 

README.md


├── 

package.json


├── 

tsconfig.json


├── .env
└── ...other configuration files
```

## Contributing

Contributions are welcome! To contribute:

1. **Fork the Repository:**

   Click the **"Fork"** button at the top-right corner of the repository page.

2. **Clone Your Fork:**

   ```bash
   git clone https://github.com/mohammed-alaa40123/ECE461-group32
   cd ECE461-group32
   ```

3. **Create a New Branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes:**

   Implement your feature or bug fix ensuring adherence to the project's coding standards.

5. **Commit Your Changes:**

   ```bash
   git commit -m "Add feature: your feature description"
   ```

6. **Push to Your Fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request:**

   Navigate to the original repository and click on **"Compare & pull request"**.

## License

This project is licensed under the [MIT License](./LICENSE).

## Contact

For any questions or feedback, please contact:

- **Name:** Mohamed Ahmed
- **Email:** mohame43@purdue.edu

- **Name:** Amar AlAzizy 
- **Email:** alazizy@purdue.edu

- **Name:** Bola Warsy
- **Email:** bwarsy@purdue.edu

- **Name:** Andrew Cali
- **Email:** acali@purdue.edu
- **GitHub:** [@mohammed-alaa40123](https://github.com/mohammed-alaa40123)


