# Stage 1: Build The React App

FROM node:20-alpine AS builder

# Set Working Directory inside Container
WORKDIR /app

# Copy Only Dependency Files first (For Docker Catch)
COPY app/package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application source
COPY app/ .

# Build Production-static static file
RUN npm run build

# Stage 2: Serve with Nginx 

FROM nginx:alpine

# Copy build file from root to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

#Start Nginx in foreground
CMD [ "nginx", "-g", "daemon off;" ]