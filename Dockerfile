FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Cài đặt dependencies và dev dependencies
RUN npm ci

# Cài thêm nodemon global nếu cần
RUN npm install -g nodemon @nestjs/cli

# Không cần COPY . . vì sẽ dùng volume

EXPOSE 8000

# Sử dụng start:dev để có hot-reload
CMD ["npm", "run", "start:dev"]