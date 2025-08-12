import 'package:flutter/material.dart';

class ChatPage extends StatelessWidget {
  final String walletAddress;
  final String token;

  const ChatPage({super.key, required this.walletAddress, required this.token});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Blockchain Chat")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Wallet: $walletAddress"),
            const SizedBox(height: 10),
            Text("Auth Token: $token"),
            const SizedBox(height: 30),
            const Text("Welcome to the chat! 🎉"),
          ],
        ),
      ),
    );
  }
}
