import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:bip39/bip39.dart' as bip39;
import '../../core/crypto/crypto_service.dart';
import '../../core/storage/secure_storage.dart';

class PrivateKeyDialog extends StatefulWidget {
  const PrivateKeyDialog({super.key});

  @override
  State<PrivateKeyDialog> createState() => _PrivateKeyDialogState();
}

class _PrivateKeyDialogState extends State<PrivateKeyDialog> {
  final _inputCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _inputCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final input = _inputCtrl.text.trim();
    if (input.isEmpty) {
      setState(() => _error = 'Input tidak boleh kosong');
      return;
    }

    setState(() { _loading = true; _error = null; });

    try {
      String finalPrivateKey = '';

      if (input.contains('BEGIN PRIVATE KEY')) {
        // Assume it's already a PEM format private key
        finalPrivateKey = input;
      } else {
        // Assume it's a seed phrase
        if (!bip39.validateMnemonic(input)) {
          setState(() => _error = 'Seed phrase tidak valid');
          return;
        }
        final seedBytes = bip39.mnemonicToSeed(input);
        final seed32 = Uint8List.fromList(seedBytes.take(32).toList());
        final keyPair = await CryptoService.generateKeyPair(input);
        finalPrivateKey = keyPair.privateKeyPem;
      }

      await SecureStorage.instance.savePrivateKey(finalPrivateKey);
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      setState(() => _error = 'Gagal memproses kunci: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Kunci Akses Dibutuhkan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Anda baru saja masuk dari perangkat baru atau kunci akses tidak ditemukan di memori perangkat. Silakan masukkan Seed Phrase (24 kata) atau Private Key Anda untuk melanjutkan.',
              style: TextStyle(color: Colors.grey[700], fontSize: 13),
            ),
            const SizedBox(height: 16),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(8),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(color: const Color(0xFFfee2e2), borderRadius: BorderRadius.circular(6)),
                child: Text(_error!, style: const TextStyle(color: Color(0xFFdc2626), fontSize: 12)),
              ),
            TextFormField(
              controller: _inputCtrl,
              maxLines: 5,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              decoration: const InputDecoration(
                labelText: 'Seed Phrase / Private Key',
                hintText: 'Masukkan di sini...',
                alignLabelWithHint: true,
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _loading ? null : () => Navigator.of(context).pop(false),
          child: const Text('Batal', style: TextStyle(color: Colors.grey)),
        ),
        ElevatedButton(
          onPressed: _loading ? null : _submit,
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1a1a1a), foregroundColor: Colors.white),
          child: _loading 
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Simpan'),
        ),
      ],
    );
  }
}

Future<bool> showPrivateKeyDialog(BuildContext context) async {
  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) => const PrivateKeyDialog(),
  );
  return result ?? false;
}
