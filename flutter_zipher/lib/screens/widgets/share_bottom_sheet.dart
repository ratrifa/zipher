import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/crypto/crypto_service.dart';
import '../../core/storage/secure_storage.dart';
import '../../models/file_item.dart';

void showShareBottomSheet(BuildContext context, FileItem file) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => _ShareSheet(file: file),
  );
}

class _ShareSheet extends StatefulWidget {
  final FileItem file;
  const _ShareSheet({required this.file});

  @override
  State<_ShareSheet> createState() => _ShareSheetState();
}

class _ShareSheetState extends State<_ShareSheet> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  List<Map<String, dynamic>> _users = [];
  Map<String, dynamic>? _selected;
  bool _searching = false;
  bool _sharing = false;
  String? _error;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearch(String q) {
    _debounce?.cancel();
    if (q.trim().isEmpty) {
      setState(() => _users = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 500), () => _search(q.trim()));
  }

  Future<void> _search(String q) async {
    setState(() { _searching = true; _users = []; });
    try {
      final res = await dio.get(Endpoints.usersSearch, queryParameters: {'q': q});
      setState(() => _users = List<Map<String, dynamic>>.from(res.data['users'] as List));
    } catch (e) {
      setState(() => _error = ApiClient.errorMessage(e));
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  Future<void> _share() async {
    if (_selected == null) return;
    setState(() { _sharing = true; _error = null; });
    try {
      final privateKeyPem = await SecureStorage.instance.getPrivateKey();
      if (privateKeyPem == null) throw Exception('Private key tidak ditemukan');

      // Get encrypted AES key for this file
      final keyRes = await dio.get(Endpoints.fileKey(widget.file.id));
      final encryptedAesKeyB64 = keyRes.data['aes_key_encrypted'] as String;
      final encryptedAesKey = _base64Decode(encryptedAesKeyB64);

      // Decrypt AES key with owner's private key
      final aesKey = await CryptoService.decryptAesKeyWithRsa(encryptedAesKey, privateKeyPem);

      // Re-encrypt AES key with recipient's public key
      final recipientPublicKey = _selected!['public_key'] as String;
      final reEncryptedKey = await CryptoService.encryptAesKeyWithRsa(aesKey, recipientPublicKey);

      // Send share request
      await dio.post(Endpoints.share, data: {
        'file_id': widget.file.id,
        'receiver_id': _selected!['id'],
        'aes_key_encrypted_for_receiver': _base64Encode(reEncryptedKey),
      });

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('File dibagikan ke ${_selected!['username']}')),
        );
      }
    } catch (e) {
      setState(() => _error = ApiClient.errorMessage(e));
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  static Uint8List _base64Decode(String s) {
    final data = Uri.parse('data:application/octet-stream;base64,$s').data;
    return data != null ? Uint8List.fromList(data.contentAsBytes()) : Uint8List(0);
  }

  static String _base64Encode(List<int> bytes) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    final result = StringBuffer();
    for (var i = 0; i < bytes.length; i += 3) {
      final b0 = bytes[i];
      final b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      final b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      result.write(chars[(b0 >> 2) & 0x3f]);
      result.write(chars[((b0 << 4) | (b1 >> 4)) & 0x3f]);
      result.write(i + 1 < bytes.length ? chars[((b1 << 2) | (b2 >> 6)) & 0x3f] : '=');
      result.write(i + 2 < bytes.length ? chars[b2 & 0x3f] : '=');
    }
    return result.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: 40, height: 4,
            margin: const EdgeInsets.only(top: 12, bottom: 16),
            alignment: Alignment.center,
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Bagikan "${widget.file.name}"',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchCtrl,
                  onChanged: _onSearch,
                  decoration: const InputDecoration(
                    hintText: 'Cari pengguna...',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                ),
                const SizedBox(height: 12),
                if (_error != null)
                  Text(_error!, style: const TextStyle(color: Color(0xFFdc2626), fontSize: 13)),
                if (_searching)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_users.isNotEmpty)
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 200),
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: _users.length,
                      itemBuilder: (_, i) {
                        final u = _users[i];
                        final isSelected = _selected?['id'] == u['id'];
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFF1a1a1a),
                            child: Text(
                              (u['username'] as String? ?? '?')[0].toUpperCase(),
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                            ),
                          ),
                          title: Text(u['username'] as String? ?? ''),
                          subtitle: Text(u['email'] as String? ?? ''),
                          trailing: isSelected
                              ? const Icon(Icons.check_circle_rounded, color: Color(0xFF22c55e))
                              : null,
                          onTap: () => setState(() => _selected = isSelected ? null : u),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          selected: isSelected,
                          selectedTileColor: const Color(0xFFf0fdf4),
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _selected == null || _sharing ? null : _share,
                  child: _sharing
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(
                          _selected != null ? 'Bagikan ke ${_selected!['username']}' : 'Pilih pengguna',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
