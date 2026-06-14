import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/crypto/crypto_service.dart';

class RecoverKeysScreen extends ConsumerStatefulWidget {
  const RecoverKeysScreen({super.key});

  @override
  ConsumerState<RecoverKeysScreen> createState() => _RecoverKeysScreenState();
}

class _RecoverKeysScreenState extends ConsumerState<RecoverKeysScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _seedCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _recoveredPrivateKey;
  bool _copied = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _seedCtrl.dispose();
    super.dispose();
  }

  Future<void> _recover() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    
    final seedWords = _seedCtrl.text.trim().split(RegExp(r'\s+'));
    if (seedWords.length != 24) {
      setState(() => _error = 'Seed phrase harus terdiri dari 24 kata');
      return;
    }

    setState(() { _loading = true; _error = null; _recoveredPrivateKey = null; });
    try {
      final keyPair = await CryptoService.generateKeyPair(
        _seedCtrl.text.trim().toLowerCase(),
      );
      setState(() {
        _recoveredPrivateKey = keyPair.privateKeyPem;
      });
    } on FormatException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (e) {
      if (mounted) setState(() => _error = 'Gagal memulihkan kunci: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _copyKey() async {
    if (_recoveredPrivateKey == null) return;
    await Clipboard.setData(ClipboardData(text: _recoveredPrivateKey!));
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf3f4f6),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Text(
                    'zipher.',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -1),
                  ),
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(28),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'Pulihkan Private Key',
                              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 28),
                            if (_error != null)
                              Container(
                                padding: const EdgeInsets.all(12),
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFfee2e2),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(_error!, style: const TextStyle(color: Color(0xFFdc2626), fontSize: 13)),
                              ),
                            const Text('Email', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                hintText: 'nama@email.com',
                              ),
                              validator: (v) => (v?.isEmpty ?? true) ? 'Email wajib diisi' : null,
                            ),
                            const SizedBox(height: 16),
                            const Text('Seed Phrase (24 kata)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _seedCtrl,
                              maxLines: 4,
                              decoration: const InputDecoration(
                                hintText: 'Masukkan 24 kata seed phrase, dipisahkan spasi...',
                              ),
                              validator: (v) => (v?.isEmpty ?? true) ? 'Seed phrase wajib diisi' : null,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Pisahkan setiap kata dengan spasi. Huruf kecil semua.',
                              style: TextStyle(color: Colors.grey[600], fontSize: 12),
                            ),
                            const SizedBox(height: 24),
                            
                            if (_recoveredPrivateKey != null) ...[
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFf0fdf4),
                                  border: Border.all(color: const Color(0xFFbbf7d0)),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const Text('Private Key Anda berhasil dipulihkan:', style: TextStyle(color: Color(0xFF166534), fontWeight: FontWeight.w600, fontSize: 13)),
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
                                              _recoveredPrivateKey!.replaceAll('\n', ''),
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
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                            ],

                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1a1a1a),
                                foregroundColor: Colors.white,
                                minimumSize: const Size(double.infinity, 48),
                                elevation: 0,
                              ),
                              onPressed: _loading ? null : _recover,
                              child: _loading
                                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('Pulihkan Kunci', style: TextStyle(fontWeight: FontWeight.w600)),
                            ),
                            const SizedBox(height: 16),
                            TextButton(
                              onPressed: () => context.go('/login'),
                              style: TextButton.styleFrom(foregroundColor: Colors.grey[600]),
                              child: const Text('Kembali ke login', style: TextStyle(fontSize: 13)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
