# Start with an Ubuntu base image
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install required packages
RUN apt-get update && \
    apt-get install -y \
    mysql-server \
    wget \
    curl \
    unzip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*


# Set up the app directory
COPY package.json /app/package.json
WORKDIR /app

RUN curl -LO https://downloads.mysql.com/docs/sakila-db.tar.gz && \
    tar -xvzf sakila-db.tar.gz && \
    cd sakila-db && \
    rm -rf sakila-db.tar.gz

RUN mv sakila-db/sakila-schema.sql /app/sakila-schema.sql && \
    mv sakila-db/sakila-data.sql /app/sakila-data.sql
# Install Node.js dependencies
RUN npm install

# Copy the index.js file to the container
COPY index.js /app/index.js

# Expose MySQL port and app port
EXPOSE 3306
EXPOSE 80

# Configure MySQL to listen on all interfaces (needed for Docker networking)
RUN sed -i "s/^bind-address.*$/bind-address = 0.0.0.0/" /etc/mysql/mysql.conf.d/mysqld.cnf

# Add the startup script
COPY container_boot.sh /container_boot.sh

# Make the startup script executable
RUN chmod +x /container_boot.sh

# Use the startup script to run both MySQL and the Node.js app
CMD ["/container_boot.sh"]
