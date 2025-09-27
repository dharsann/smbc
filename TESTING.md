# XMTP Message Testing Guide

## Prerequisites for Testing

### 1. MetaMask Setup
- Install MetaMask browser extension
- Create at least 2 different wallet accounts for testing
- Make sure both wallets have some ETH on mainnet (for XMTP identity creation)
- Switch between accounts to test peer-to-peer messaging

### 2. XMTP Network Requirements
- XMTP works on Ethereum mainnet
- First-time users need to create an XMTP identity (one-time process)
- Identity creation requires a small gas fee (~$1-5 depending on network)

## Testing Steps

### Step 1: Start the Application
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Step 2: Connect First Wallet
1. Open `http://localhost:3000`
2. Click "Connect Wallet" 
3. Select your first MetaMask account
4. Sign the authentication message
5. Wait for XMTP initialization (may take 10-30 seconds)
6. Look for "XMTP Ready" status in the header

### Step 3: Add Second Wallet as Contact
1. Copy the address of your second MetaMask account
2. In the sidebar, paste the wallet address in the "Enter wallet address..." field
3. Click "Add" button
4. The contact should appear in your contacts list

### Step 4: Test Messaging from First Account
1. Click on the contact you just added
2. Type a test message: "Hello from Account 1!"
3. Click "Send" or press Enter
4. Message should appear in the chat area

### Step 5: Switch to Second Wallet
1. Open a new browser window/tab (or incognito mode)
2. Go to `http://localhost:3000`
3. Connect with your second MetaMask account
4. Sign the authentication message
5. Wait for XMTP initialization

### Step 6: Add First Wallet as Contact (from second account)
1. Copy the address of your first MetaMask account
2. Add it as a contact using the sidebar
3. Click on the contact to open the chat

### Step 7: Verify Message Reception
1. You should see the message "Hello from Account 1!" in the chat
2. Reply with "Hello back from Account 2!"
3. Switch back to the first browser window
4. Refresh or click on the contact again
5. You should see both messages

## Testing Different Message Types

### Text Messages
```
Simple text: "Hello World!"
Emoji: "👋 Hello! 🚀"
Long message: "This is a longer message to test how the UI handles multiple lines and word wrapping..."
```

### File Messages
1. Click the 📎 attachment button
2. Select any file (image, document, etc.)
3. Click "Send"
4. File should be uploaded to IPFS and shared via XMTP

## Debugging Common Issues

### XMTP Not Initializing
**Symptoms:** "Initializing XMTP..." never changes to "XMTP Ready"

**Solutions:**
1. Check browser console for errors
2. Ensure wallet is connected to Ethereum mainnet
3. Try refreshing the page
4. Clear browser cache and localStorage

### Messages Not Sending
**Symptoms:** Messages don't appear after clicking send

**Debug steps:**
1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Look for XMTP-related error messages
4. Verify XMTP status shows "Ready"

### Messages Not Receiving
**Symptoms:** Messages sent from one account don't appear in the other

**Debug steps:**
1. Refresh the receiving account's browser
2. Click on the contact again to reload messages
3. Check if both accounts have XMTP initialized
4. Verify both accounts are using the same XMTP environment (production)

## Advanced Testing

### Test Multiple Conversations
1. Create 3+ MetaMask accounts
2. Add all accounts as contacts from one main account
3. Send messages to different contacts
4. Verify message isolation (messages only appear in correct conversations)

### Test File Sharing
1. Send various file types: images, PDFs, text files
2. Verify file names and sizes display correctly
3. Test file download functionality
4. Check IPFS links work in browser

### Test Profile Updates
1. Update username and display name
2. Upload profile picture
3. Verify changes appear in contacts list
4. Test with special characters and emojis

## Performance Testing

### Message History Loading
1. Send 10+ messages between two accounts
2. Refresh browser and reload conversation
3. Verify all messages load correctly
4. Check loading time for message history

### XMTP Client Performance
1. Leave chat open for extended periods
2. Send messages periodically
3. Monitor browser memory usage
4. Check for memory leaks in developer tools

## Network Testing

### Different Network Conditions
1. Test on slow internet connection
2. Test with intermittent connectivity
3. Verify message queuing and retry logic

### Cross-Browser Testing
1. Test Chrome ↔ Firefox messaging
2. Test desktop ↔ mobile browser
3. Verify consistent behavior across browsers

## Troubleshooting Commands

### Clear Application State
```javascript
// Run in browser console to clear all local data
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check XMTP Status
```javascript
// Run in browser console to check XMTP client status
console.log('XMTP Client:', window.xmtpClient);
```

### Debug Message Flow
1. Open browser developer tools
2. Go to Network tab
3. Send a message
4. Look for XMTP-related network requests
5. Check for any failed requests

## Expected Behavior

### Successful Message Flow
1. User types message → Click send
2. Message appears immediately in sender's chat
3. Message is sent to XMTP network
4. Recipient refreshes or reloads conversation
5. Message appears in recipient's chat

### File Sharing Flow
1. User selects file → Click send
2. File uploads to IPFS (may take 5-30 seconds)
3. IPFS CID is sent via XMTP
4. Recipient sees file attachment with download option
5. Clicking download retrieves file from IPFS

## Production Considerations

### XMTP Limitations
- Messages may take 1-30 seconds to propagate
- Large files (>10MB) may be slow to upload/download
- XMTP identity creation requires gas fees
- Message history is limited to XMTP network retention

### Scaling Considerations
- Each user needs their own XMTP identity
- No server-side message storage
- Contact management still uses your backend
- IPFS file storage has size limitations

## Success Criteria

✅ **Basic Messaging**
- Messages send and receive between different wallets
- Message timestamps display correctly
- Chat history loads properly

✅ **File Sharing**
- Files upload to IPFS successfully
- File metadata displays correctly
- Files can be downloaded by recipients

✅ **User Management**
- Contacts can be added by wallet address
- Profile updates work correctly
- Authentication flow completes successfully

✅ **XMTP Integration**
- XMTP client initializes without errors
- Messages are truly peer-to-peer
- No message data stored on your backend