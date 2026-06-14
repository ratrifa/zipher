import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart'; // dipakai untuk context.push('/register')
import '../../core/api/api_client.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  // Forgot password state
  bool _showReset = false;
  int _resetStep = 0; // 0=email, 1=privateKey, 2=newPassword
  final _resetEmailCtrl = TextEditingController();
  final _resetKeyCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _resetLoading = false;
  String? _resetError;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _resetEmailCtrl.dispose();
    _resetKeyCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(authProvider.notifier).login(
        _emailCtrl.text.trim(),
        _passCtrl.text,
      );
      // Router otomatis redirect ke /dashboard/files via refreshListenable
    } catch (e) {
      if (mounted) setState(() => _error = ApiClient.errorMessage(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _nextResetStep() async {
    setState(() { _resetLoading = true; _resetError = null; });
    try {
      final notifier = ref.read(authProvider.notifier);
      if (_resetStep == 0) {
        await notifier.forgotPassword(_resetEmailCtrl.text.trim());
        setState(() => _resetStep = 1);
      } else if (_resetStep == 1) {
        await notifier.verifyResetKey(
          _resetEmailCtrl.text.trim(),
          _resetKeyCtrl.text.trim(),
        );
        setState(() => _resetStep = 2);
      } else {
        if (_newPassCtrl.text != _confirmPassCtrl.text) {
          setState(() => _resetError = 'Password tidak cocok');
          return;
        }
        await notifier.resetPassword(
          email: _resetEmailCtrl.text.trim(),
          privateKey: _resetKeyCtrl.text.trim(),
          newPassword: _newPassCtrl.text,
        );
        setState(() { _showReset = false; _resetStep = 0; });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Password berhasil diubah')),
          );
        }
      }
    } catch (e) {
      setState(() => _resetError = ApiClient.errorMessage(e));
    } finally {
      if (mounted) setState(() => _resetLoading = false);
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
              child: _showReset ? _buildResetCard() : _buildLoginCard(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginCard() {
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
              Text('Masuk ke akun Anda', style: TextStyle(color: Colors.grey[600], fontSize: 14)),
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
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => (v?.isEmpty ?? true) ? 'Email wajib diisi' : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _passCtrl,
                obscureText: _obscure,
                decoration: InputDecoration(
                  labelText: 'Password',
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                validator: (v) => (v?.isEmpty ?? true) ? 'Password wajib diisi' : null,
              ),
              const SizedBox(height: 8),
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  TextButton(
                    onPressed: () => context.go('/recover-key'),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
                    child: const Text('Pulihkan Private Key', style: TextStyle(fontSize: 13)),
                  ),
                  TextButton(
                    onPressed: () => setState(() { _showReset = true; _resetStep = 0; }),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
                    child: const Text('Lupa password?', style: TextStyle(fontSize: 13)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loading ? null : _login,
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Masuk', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
              const SizedBox(height: 16),
              Wrap(
                alignment: WrapAlignment.center,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text('Belum punya akun?', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  TextButton(
                    onPressed: () => context.go('/register'),
                    child: const Text('Daftar', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResetCard() {
    final titles = ['Reset Password', 'Verifikasi Private Key', 'Password Baru'];
    final subtitles = [
      'Masukkan email akun Anda',
      'Masukkan private key Anda untuk verifikasi',
      'Buat password baru',
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_rounded),
                  onPressed: () => setState(() {
                    if (_resetStep > 0) {
                      _resetStep--;
                    } else {
                      _showReset = false;
                    }
                  }),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(titles[_resetStep], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      Text(subtitles[_resetStep], style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            if (_resetError != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFfee2e2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_resetError!, style: const TextStyle(color: Color(0xFFdc2626), fontSize: 13)),
              ),
            if (_resetStep == 0)
              TextFormField(
                controller: _resetEmailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
            if (_resetStep == 1)
              TextFormField(
                controller: _resetKeyCtrl,
                maxLines: 5,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                decoration: const InputDecoration(
                  labelText: 'Private Key (PEM)',
                  alignLabelWithHint: true,
                ),
              ),
            if (_resetStep == 2) ...[
              TextFormField(
                controller: _newPassCtrl,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password Baru'),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _confirmPassCtrl,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Konfirmasi Password'),
              ),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _resetLoading ? null : _nextResetStep,
              child: _resetLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_resetStep == 2 ? 'Simpan Password' : 'Lanjutkan',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}
