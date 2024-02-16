# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application files to the working directory
COPY . .

# Expose the port your application will run on
EXPOSE 3080

# Define the default command to start your application
CMD ["npm", "start"]
