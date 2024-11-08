# Use a Node.js image to build the TypeScript code
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code (outputting directly to backend/src)
RUN npm run build

# Use the official AWS Lambda Node.js 18 runtime as a base image
FROM public.ecr.aws/lambda/nodejs:18
RUN mkdir -p /Temp

# Set working directory for Lambda runtime
WORKDIR /var/task

# Copy the compiled JavaScript file(s) and other necessary files from the build stage
COPY --from=build /app/index.js ./
COPY --from=build /app/package.json ./
COPY --from=build /app/eslint.config.mjs ./
COPY --from=build /app/default.eslintrc.json ./
COPY --from=build /app/Temp ./Temp

# Copy the necessary node_modules folder from the build stage
COPY --from=build /app/node_modules ./node_modules

# Command for Lambda to start
CMD ["index.handler"]
