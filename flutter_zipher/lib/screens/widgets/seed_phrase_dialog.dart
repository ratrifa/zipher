import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:bip39/bip39.dart' as bip39;
import '../../core/crypto/crypto_service.dart';
import '../../core/storage/secure_storage.dart';

/// Recovers the private key from a 24-word seed phrase and stores it on the
/// device. Used by "Pulihkan Kunci" — seed phrase is the recovery material for
/// the private key (the private key itself is used everywhere else in the app).
///
/// After recovery it shows the derived private key so the user can copy or
/// download it, matching the web app.
class SeedPhraseDialog extends StatefulWidget {
  const SeedPhraseDialog({super.key});

  @override
  State<SeedPhraseDialog> createState() => _SeedPhraseDialogState();
}

class _SeedPhraseDialogState extends State<SeedPhraseDialog> {
  final _inputCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _recoveredKey;
  bool _copied = false;

  @override
  void dispose() {
    _inputCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final phrase = _inputCtrl.text.trim().toLowerCase().replaceAll(RegExp(r'\s+'), ' ');
    if (phrase.isEmpty) {
      setState(() => _error = 'Seed phrase tidak boleh kosong');
      return;
    }
    if (phrase.split(' ').length != 24) {
      setState(() => _error = 'Seed phrase harus terdiri dari 24 kata');
      return;
    }
    if (!bip39.validateMnemonic(phrase)) {
      setState(() => _error = 'Seed phrase tidak valid');
      return;
    }

    setState(() { _loading = true; _error = null; });
    try {
      final keyPair = await CryptoService.generateKeyPair(phrase);
      await SecureStorage.instance.savePrivateKey(keyPair.privateKeyPem);
      if (mounted) setState(() => _recoveredKey = CryptoService.toBase64Key(keyPair.privateKeyPem));
    } catch (e) {
      setState(() => _error = 'Gagal memulihkan kunci: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _copyKey() async {
    await Clipboard.setData(ClipboardData(text: _recoveredKey!));
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }

  Future<void> _downloadKey() async {
    try {
      final bytes = Uint8List.fromList(utf8.encode(_recoveredKey!));
      // Let the user choose where to save (e.g. Downloads). On mobile the
      // bytes are written by the picker; on desktop we write them ourselves.
      final path = await FilePicker.platform.saveFile(
        dialogTitle: 'Simpan Private Key',
        fileName: 'zipher_private_key.pem',
        bytes: bytes,
      );
      if (path == null) return;
      if (!(Platform.isAndroid || Platform.isIOS)) {
        await File(path).writeAsBytes(bytes);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Private key disimpan di $path')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal menyimpan file')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Pulihkan Kunci', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      content: SingleChildScrollView(
        child: _recoveredKey == null ? _buildInput() : _buildResult(),
      ),
      actions: _recoveredKey == null
          ? [
              TextButton(
                onPressed: _loading ? null : () => Navigator.of(context).pop(false),
                child: const Text('Batal', style: TextStyle(color: Colors.grey)),
              ),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1a1a1a), foregroundColor: Colors.white),
                child: _loading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Pulihkan'),
              ),
            ]
          : [
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1a1a1a), foregroundColor: Colors.white),
                child: const Text('Selesai'),
              ),
            ],
    );
  }

  Widget _buildInput() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Masukkan Seed Phrase (24 kata) untuk memulihkan Private Key Anda di perangkat ini.',
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
          maxLines: 4,
          style: const TextStyle(fontSize: 13),
          decoration: const InputDecoration(
            labelText: 'Seed Phrase (24 kata)',
            hintText: 'Masukkan 24 kata, dipisahkan spasi...',
            alignLabelWithHint: true,
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 6),
        Text('Pisahkan setiap kata dengan spasi.', style: TextStyle(color: Colors.grey[600], fontSize: 11)),
      ],
    );
  }

  Widget _buildResult() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFf0fdf4),
            border: Border.all(color: const Color(0xFFbbf7d0)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Text(
            'Private Key berhasil dipulihkan, simpan Private Key anda',
            style: TextStyle(color: Color(0xFF166534), fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Private Key', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: const Color(0xFFe5e7eb)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  _recoveredKey!.replaceAll('\n', ''),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _copyKey,
                icon: Icon(_copied ? Icons.check_rounded : Icons.copy_rounded, size: 20),
                style: IconButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: const BorderSide(color: Color(0xFFe5e7eb)),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            backgroundColor: const Color(0xFFf3f4f6),
            side: BorderSide.none,
            minimumSize: const Size(double.infinity, 44),
          ),
          onPressed: _downloadKey,
          icon: const Icon(Icons.download_rounded, size: 16),
          label: const Text('Unduh Private Key (.pem)', style: TextStyle(fontSize: 13)),
        ),
      ],
    );
  }
}

Future<bool> showSeedPhraseDialog(BuildContext context) async {
  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (_) => const SeedPhraseDialog(),
  );
  return result ?? false;
}
