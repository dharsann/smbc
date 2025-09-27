# Simple Blockchain Chat (SMBC v2)

A decentralized chat application built with Next.js, FastAPI, and XMTP protocol for secure blockchain-based messaging.

## 🚀 Features

### Core Functionality
- **Wallet Authentication**: Connect using MetaMask or other Web3 wallets
- **Decentralized Messaging**: XMTP protocol for secure peer-to-peer communication
- **User Management**: Add/remove contacts by wallet address
- **File Sharing**: IPFS integration for decentralized file storage
- **Profile Management**: Customizable user profiles with avatars

### Recent Updates
- ✅ Fixed XMTP client initialization issues
- ✅ Enhanced user management with database persistence
- ✅ Full wallet address display in sidebar
- ✅ Improved UI with profile modal and user creation
- ✅ Dark text in message input area
- ✅ Persistent user deletion in MongoDB

## 🏗️ Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Web3**: ethers.js for blockchain interactions
- **Messaging**: XMTP SDK for decentralized messaging
- **Storage**: IPFS for file storage

### Backend (FastAPI)
- **Framework**: FastAPI with Python
- **Database**: MongoDB for user and message storage
- **Authentication**: JWT with Web3 signature verification
- **File Storage**: IPFS integration

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB instance
- IPFS node (optional, uses public gateways by default)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
SECRET_KEY=your_secret_key_here
MONGODB_URL=mongodb://localhost:27017/blockchain_chat
```

5. Start the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- `SECRET_KEY`: JWT signing secret
- `MONGODB_URL`: MongoDB connection string

#### Frontend (.env.local)
- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL

## 🚀 Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Sign Authentication**: Sign the message to authenticate your wallet
3. **Add Contacts**: Use the "➕ Add" button in the sidebar to add users by wallet address
4. **Start Chatting**: Select a user from the sidebar to begin messaging
5. **Send Files**: Use the attachment button to share files via IPFS
6. **Manage Profile**: Click the profile icon to update your information

## 🛠️ API Endpoints

### Authentication
- `POST /auth/request` - Request authentication message
- `POST /auth/verify` - Verify signature and get JWT token

### User Management
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /chat/users` - Get all users
- `POST /chat/users/add` - Add user by wallet address
- `DELETE /chat/users/{user_id}` - Delete user from contacts

### Messaging
- `POST /chat/send` - Send message
- `GET /chat/messages/{peer_wallet}` - Get chat history
- `WS /ws/{user_id}` - WebSocket connection for real-time messaging

### File Storage
- `POST /ipfs/upload` - Upload file to IPFS

## 🔐 Security Features

- **Web3 Authentication**: Signature-based authentication without passwords
- **JWT Tokens**: Secure session management
- **XMTP Encryption**: End-to-end encrypted messaging
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Configured for secure cross-origin requests

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📱 Mobile Support

The application is responsive and works on mobile devices through web browsers with Web3 wallet support.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [XMTP Protocol](https://xmtp.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 🐛 Known Issues

- XMTP client initialization may take a few seconds on first load
- File uploads are limited by IPFS gateway constraints
- WebSocket connections may need reconnection on network changes

## 🚧 Roadmap

- [ ] Group chat functionality
- [ ] Message encryption indicators
- [ ] Message persistence optimization
- [ ] Push notifications
- [ ] Mobile app development
- [ ] ENS name resolution
- [ ] Message reactions and replies

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Web3 technologies
