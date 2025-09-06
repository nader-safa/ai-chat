# Use the official Bun image as the base image
FROM oven/bun:1.2.2-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and bun.lockb files to the container
COPY package.json ./

# Install dependencies
RUN bun install

# Copy the rest of your application code to the container
COPY . .

# Build the application for production
RUN bun run build

# Expose the port your app runs on
EXPOSE 5173

# Command to serve the built application
CMD ["bun", "run", "preview", "--host", "0.0.0.0", "--port", "5173"]