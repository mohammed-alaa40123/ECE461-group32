FROM amazonlinux:2023

# Install necessary packages
RUN yum update -y && \
    yum install -y \
    libpq-devel \
    gcc-c++ \
    make \
    python3 \
    nodejs \
    npm

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/src/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY backend/src/ ./

# Expose necessary ports
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
