import 'dart:convert';
import 'dart:html' as html;
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../utils/ethereum_web.dart';

class WalletLoginPage extends StatefulWidget {
  const WalletLoginPage({super.key});

  @override
  State<WalletLoginPage> createState() => _WalletLoginPageState();
}

class _WalletLoginPageState extends State<WalletLoginPage> {
  String currentAddress = '';
  bool isConnected = false;

  Future<void> connectWallet() async {
    final address = await EthereumWeb.connectWallet();
    if (address != null) {
      setState(() {
        currentAddress = address;
        isConnected = true;
      });
    }
  }

  Future<void> login() async {
    if (!isConnected) return;

    final message = await ApiClient.requestAuthMessage(currentAddress);
    if (message == null) return;

    final signature = await EthereumWeb.signMessage(message, currentAddress);
    if (signature == null) return;

    final token = await ApiClient.verifySignature(
      currentAddress,
      message,
      signature,
    );

    if (token != null) {
      final chatUrl =
          '${html.window.location.origin}/chat?token=$token&wallet=$currentAddress';
      html.window.location.href = chatUrl;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Blockchain Chat Login")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(isConnected ? "Connected: $currentAddress" : "Not connected"),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: connectWallet, child: const Text("Connect")),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: login, child: const Text("Login")),
          ],
        ),
      ),
    );
  }
}
