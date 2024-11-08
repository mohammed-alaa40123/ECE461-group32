# Use a Node.js image to build the TypeScript code
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Use the official AWS Lambda Node.js 18 runtime as a base image
FROM public.ecr.aws/lambda/nodejs:18

# Set working directory
WORKDIR /var/task

# Copy the built JavaScript files from the previous build stage
COPY --from=build /app/dist ./

# Copy the necessary node_modules folder from the build stage
COPY --from=build /app/node_modules ./node_modules

# Command for Lambda to start
CMD ["index.handler"]
