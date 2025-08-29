# CodeQuest Backend

Node.js/Express backend API for CodeQuest - A social media platform for developers.

## 🚀 Features

- **RESTful API**: Complete REST API with authentication
- **User Management**: Registration, login, profile management
- **Post System**: Create, read, like posts with media upload
- **Friends System**: Add/remove friends functionality
- **File Upload**: Local and cloud storage support (Cloudinary)
- **Authentication**: JWT-based secure authentication
- **Database**: MongoDB with Mongoose ODM

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- Cloudinary for cloud storage
- bcrypt for password hashing

## 📦 Installation

```bash
npm install
npm start
```

## 🔧 Environment Variables

Create a `.env` file:

```env
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
PORT=5000
```

## 📋 API Endpoints

### Authentication
- `POST /user/signup` - Register new user
- `POST /user/login` - User login

### Posts
- `GET /publicspace` - Get all posts
- `POST /publicspace/create` - Create new post
- `POST /publicspace/like/:id` - Like/unlike post

### Friends
- `GET /friends/list` - Get user's friends
- `POST /friends/add` - Add friend
- `DELETE /friends/remove` - Remove friend

### Users
- `GET /user/allusers` - Get all users
- `PATCH /user/update/:id` - Update user profile

## 🔗 Frontend Repository

[CodeQuest Frontend](https://github.com/HitenKatariya/codequest-frontend)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License
