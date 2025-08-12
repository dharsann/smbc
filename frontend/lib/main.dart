import 'dart:html' as html;
import 'package:flutter/material.dart';
import 'pages/login_page.dart';
import 'pages/home_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final uri = Uri.parse(html.window.location.href);
    final token = uri.queryParameters['token'];

    Widget homePage;
    if (token != null && token.isNotEmpty) {
      final wallet = uri.queryParameters['wallet'] ?? 'Unknown';
      homePage = ChatPage(walletAddress: wallet, token: token);
    } else {
      homePage = const WalletLoginPage();
    }

    return MaterialApp(
      title: 'Blockchain Chat Login',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: homePage,
    );
  }
}
