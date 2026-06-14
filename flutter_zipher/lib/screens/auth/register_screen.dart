import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _loading = false;
  String? _error;
  String? _generatedPrivateKey;
  String? _generatedSeedPhrase;
  bool _confirmed = false;
  bool _copiedSeed = false;
  bool _copiedKey = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _usernameCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_passCtrl.text != _confirmPassCtrl.text) {
      setState(() => _error = 'Password tidak cocok');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final keyPair = await ref.read(authProvider.notifier).register(
        email: _emailCtrl.text.trim(),
        username: _usernameCtrl.text.trim(),
        password: _passCtrl.text,
      );
      setState(() {
        _generatedPrivateKey = keyPair.privateKeyPem;
        _generatedSeedPhrase = keyPair.seedPhrase;
      });
    } catch (e) {
      setState(() => _error = ApiClient.errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _copySeed() async {
    await Clipboard.setData(ClipboardData(text: _generatedSeedPhrase!));
    setState(() => _copiedSeed = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copiedSeed = false);
  }

  Future<void> _copyKey() async {
    await Clipboard.setData(ClipboardData(text: _generatedPrivateKey!));
    setState(() => _copiedKey = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copiedKey = false);
  }

  Future<void> _downloadFile(String content, String filename) async {
    try {
      Directory? dir;
      if (Platform.isAndroid || Platform.isIOS) {
        dir = await getApplicationDocumentsDirectory();
      } else {
        dir = await getDownloadsDirectory();
      }
      if (dir != null) {
        final file = File('${dir.path}/$filename');
        await file.writeAsString(content);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Disimpan di ${file.path}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal menyimpan file')),
        );
      }
    }
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
              child: _generatedPrivateKey != null
                  ? _buildKeyDialog()
                  : _buildRegisterCard(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRegisterCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'zipher.',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -1),
              ),
              const SizedBox(height: 4),
              Text('Buat akun baru', style: TextStyle(color: Colors.grey[600], fontSize: 14)),
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
              TextFormField(
                controller: _usernameCtrl,
                decoration: const InputDecoration(labelText: 'Username'),
                validator: (v) => (v?.isEmpty ?? true) ? 'Username wajib diisi' : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => (v?.isEmpty ?? true) ? 'Email wajib diisi' : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _passCtrl,
                obscureText: _obscurePass,
                decoration: InputDecoration(
                  labelText: 'Password',
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePass ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setState(() => _obscurePass = !_obscurePass),
                  ),
                ),
                validator: (v) => (v?.length ?? 0) < 8 ? 'Minimal 8 karakter' : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _confirmPassCtrl,
                obscureText: _obscureConfirm,
                decoration: InputDecoration(
                  labelText: 'Konfirmasi Password',
                  suffixIcon: IconButton(
                    icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                ),
                validator: (v) => (v?.isEmpty ?? true) ? 'Konfirmasi password wajib diisi' : null,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _register,
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Daftar', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Sudah punya akun?', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Masuk', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKeyDialog() {
    final words = _generatedSeedPhrase!.split(' ');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Simpan Seed Phrase & Private Key',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            Text(
              'Seed phrase digunakan untuk memulihkan private key jika hilang. Simpan keduanya di tempat yang aman dan jangan bagikan kepada siapapun.',
              style: TextStyle(color: Colors.grey[600], fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 20),
            const Text('Seed Phrase (24 kata)', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFf3f4f6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 3.5,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: words.length,
                itemBuilder: (context, i) {
                  return Row(
                    children: [
                      Text('${i + 1}. ', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                      Expanded(
                        child: Text(words[i], style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                      ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1a1a1a),
                      foregroundColor: Colors.white,
                    ),
                    onPressed: _copySeed,
                    icon: Icon(_copiedSeed ? Icons.check_rounded : Icons.copy_rounded, size: 16),
                    label: Text(_copiedSeed ? 'Tersalin' : 'Salin Seed Phrase', style: const TextStyle(fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _downloadFile(_generatedSeedPhrase!, 'zipher_seed_phrase.txt'),
                    icon: const Icon(Icons.download_rounded, size: 16),
                    label: const Text('Unduh (.txt)', style: TextStyle(fontSize: 13)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Private Key', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: const Color(0xFFe5e7eb)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _generatedPrivateKey!.replaceAll('\n', ''),
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _copyKey,
                  icon: Icon(_copiedKey ? Icons.check_rounded : Icons.copy_rounded, size: 20),
                  style: IconButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: const BorderSide(color: Color(0xFFe5e7eb)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                backgroundColor: const Color(0xFFf3f4f6),
                side: BorderSide.none,
              ),
              onPressed: () => _downloadFile(_generatedPrivateKey!, 'zipher_private_key.pem'),
              icon: const Icon(Icons.download_rounded, size: 16),
              label: const Text('Unduh Private Key (.pem)', style: TextStyle(fontSize: 13)),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Checkbox(
                  value: _confirmed,
                  onChanged: (v) => setState(() => _confirmed = v ?? false),
                ),
                const Expanded(
                  child: Text(
                    'Saya sudah menyimpan seed phrase dengan aman',
                    style: TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _confirmed ? Colors.grey[600] : const Color(0xFFe5e7eb),
                foregroundColor: _confirmed ? Colors.white : Colors.grey[500],
                minimumSize: const Size(double.infinity, 44),
                elevation: 0,
              ),
              onPressed: _confirmed ? () => context.go('/login') : null,
              child: const Text('Lanjutkan ke Login', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}
