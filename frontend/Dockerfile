FROM node:20-slim

WORKDIR /app

# Copy package files first to cache layers
COPY package*.json ./

RUN npm install

# Copy the rest of the code
COPY . .

EXPOSE 5173

# Vite needs --host to be accessible from outside the container
CMD ["npm", "run", "dev", "--", "--host"]