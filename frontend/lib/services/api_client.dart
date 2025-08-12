import 'dart:convert';
import 'dart:html' as html;
import 'package:http/http.dart' as http;

class ApiClient {
  static final String baseUrl = html.window.location.origin
      .replaceFirst(RegExp(r":\d+$"), ":8080");

  static Future<String?> requestAuthMessage(String walletAddress) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/request'),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"wallet_address": walletAddress}),
    );
    if (res.statusCode != 200) {
      print("Error: ${res.body}");
      return null;
    }
    final data = jsonDecode(res.body);
    return data['message'];
  }

  static Future<String?> verifySignature(
      String walletAddress, String message, String signature) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/verify'),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "wallet_address": walletAddress,
        "message": message,
        "signature": signature,
      }),
    );

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return data['access_token'];
    } else {
      print("Login failed: ${res.body}");
      return null;
    }
  }
}
