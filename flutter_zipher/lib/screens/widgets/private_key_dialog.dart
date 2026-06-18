import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
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

    // Accept either full PEM or the raw base64 body (the form shown/copied
    // elsewhere in the app). Validate by base64-decoding the key body.
    final body = input.split('\n').where((l) => !l.startsWith('-----')).join().trim();
    try {
      if (base64.decode(body).isEmpty) throw const FormatException('empty');
    } catch (_) {
      setState(() => _error = 'Private key tidak valid');
      return;
    }

    setState(() { _loading = true; _error = null; });

    try {
      // Verify the key actually belongs to this account before saving:
      // its RSA modulus must match the account's public key.
      final res = await dio.get(Endpoints.me);
      final publicKey = res.data['data']?['public_key'] as String?;
      if (publicKey == null || publicKey.isEmpty) {
        setState(() => _error = 'Gagal mengambil public key akun');
        return;
      }
      if (!CryptoService.privateKeyMatchesPublic(input, publicKey)) {
        setState(() => _error = 'Private key tidak cocok dengan akun ini');
        return;
      }

      await SecureStorage.instance.savePrivateKey(input);
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      setState(() => _error = 'Gagal memproses kunci: ${ApiClient.errorMessage(e)}');
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
              'Anda baru saja masuk dari perangkat baru atau kunci akses tidak ditemukan di memori perangkat. Silakan masukkan Private Key Anda untuk melanjutkan.',
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
                labelText: 'Private Key',
                hintText: '-----BEGIN PRIVATE KEY-----',
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
