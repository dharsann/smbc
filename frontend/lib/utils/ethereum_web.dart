import 'package:flutter_web3/flutter_web3.dart';

class EthereumWeb {
  static Future<String?> connectWallet() async {
    if (ethereum != null) {
      try {
        final accounts = await ethereum!.requestAccount();
        return accounts.first;
      } catch (e) {
        print("User rejected request: $e");
        return null;
      }
    } else {
      print("MetaMask not installed");
      return null;
    }
  }

  static Future<String?> signMessage(String message, String address) async {
    try {
      final signature = await ethereum!.request('personal_sign', [
        message,
        address,
      ]);
      return signature;
    } catch (e) {
      print("Error signing message: $e");
      return null;
    }
  }
}
