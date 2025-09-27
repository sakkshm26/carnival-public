FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build
RUN mkdir -p logs
COPY start.sh ./
RUN chmod +x start.sh
EXPOSE 4000
CMD ["./start.sh"]