import 'dart:typed_data';
import 'package:bip39/bip39.dart' as bip39;
import 'lib/core/crypto/crypto_service.dart';

void main() async {
  final mnemonic = bip39.generateMnemonic();
  final seedBytes = bip39.mnemonicToSeed(mnemonic);
  final seed32 = Uint8List.fromList(seedBytes.take(32).toList());
  
  final keyPair1 = await CryptoService.generateDeterministicKeyPair(seed32);
  final keyPair2 = await CryptoService.generateDeterministicKeyPair(seed32);
  
  print('Match? \');
}