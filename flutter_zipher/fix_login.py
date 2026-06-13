import re

with open("lib/screens/auth/login_screen.dart", "r", encoding="utf-8") as f:
    content = f.read()

new_state_vars = """  // Forgot password state
  bool _showReset = false;
  int _resetStep = 0; // 0=email, 1=privateKey, 2=newPassword
  final _resetEmailCtrl = TextEditingController();
  final _resetKeyCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _resetLoading = false;
  String? _resetError;

  // Recover private key state
  bool _showRecover = false;
  final _recoverEmailCtrl = TextEditingController();
  final _recoverSeedCtrl = TextEditingController();
  bool _recoverLoading = false;
  String? _recoverError;
  String? _recoveredPrivateKey;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _resetEmailCtrl.dispose();
    _resetKeyCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    _recoverEmailCtrl.dispose();
    _recoverSeedCtrl.dispose();
    super.dispose();
  }"""

content = re.sub(r'  // Forgot password state.*?super\.dispose\(\);\n  \}', new_state_vars, content, flags=re.DOTALL)

next_reset_step = """  Future<void> _nextResetStep() async {
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

  Future<void> _recoverKey() async {
    setState(() { _recoverLoading = true; _recoverError = null; });
    try {
      final mnemonic = _recoverSeedCtrl.text.trim();
      if (!bip39.validateMnemonic(mnemonic)) {
        setState(() => _recoverError = 'Seed phrase tidak valid');
        return;
      }
      final seedBytes = bip39.mnemonicToSeed(mnemonic);
      final seed32 = Uint8List.fromList(seedBytes.take(32).toList());
      final keyPair = await CryptoService.generateDeterministicKeyPair(seed32);
      setState(() {
        _recoveredPrivateKey = keyPair.privateKeyPem;
      });
    } catch (e) {
      setState(() => _recoverError = 'Gagal memulihkan kunci: $e');
    } finally {
      if (mounted) setState(() => _recoverLoading = false);
    }
  }"""

content = re.sub(r'  Future<void> _nextResetStep\(\) async \{.*?    \}\n  \}', next_reset_step, content, flags=re.DOTALL)

build_logic = """  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf3f4f6),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: _showRecover ? _buildRecoverCard() : (_showReset ? _buildResetCard() : _buildLoginCard()),
            ),
          ),
        ),
      ),
    );
  }"""

content = re.sub(r'  @override\n  Widget build\(BuildContext context\) \{.*?    \);\n  \}', build_logic, content, flags=re.DOTALL)

build_reset_card = """  Widget _buildResetCard() {
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
            if (_resetStep == 1) ...[
              TextFormField(
                controller: _resetKeyCtrl,
                maxLines: 5,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                decoration: const InputDecoration(
                  labelText: 'Private Key (PEM)',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => setState(() {
                    _showReset = false;
                    _showRecover = true;
                    _recoverEmailCtrl.text = _resetEmailCtrl.text;
                    _recoveredPrivateKey = null;
                  }),
                  child: const Text('Lupa private key?', style: TextStyle(fontSize: 13)),
                ),
              ),
            ],
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

  Widget _buildRecoverCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'zipher.',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -1),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            const Text(
              'Pulihkan Private Key',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            if (_recoverError != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFfee2e2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_recoverError!, style: const TextStyle(color: Color(0xFFdc2626), fontSize: 13)),
              ),
            if (_recoveredPrivateKey != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFf3f4f6),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFe5e7eb)),
                ),
                child: Text(
                  _recoveredPrivateKey!,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 10, height: 1.5),
                  maxLines: 8,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () {
                  // clipboard not imported? let's assume it works since it's from services
                  // wait, I need to import services? Yes, `import 'package:flutter/services.dart';`
                  // Let's add that to imports if needed. I will add it.
                },
                icon: const Icon(Icons.copy_rounded, size: 16),
                label: const Text('Salin Private Key'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _showRecover = false;
                    _showReset = true;
                    _resetStep = 1;
                    _resetKeyCtrl.text = _recoveredPrivateKey!;
                  });
                },
                child: const Text('Lanjutkan Reset Password', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ] else ...[
              TextFormField(
                controller: _recoverEmailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _recoverSeedCtrl,
                maxLines: 4,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                decoration: const InputDecoration(
                  labelText: 'Seed Phrase (24 kata)',
                  hintText: 'Masukkan 24 kata seed phrase, dipisahkan spasi...',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Pisahkan setiap kata dengan spasi. Huruf kecil semua.',
                style: TextStyle(color: Colors.grey, fontSize: 11),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _recoverLoading ? null : _recoverKey,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1a1a1a),
                  foregroundColor: Colors.white,
                ),
                child: _recoverLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Pulihkan Kunci', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ],
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => setState(() => _showRecover = false),
              child: const Text('Kembali ke login', style: TextStyle(fontSize: 13, color: Colors.grey)),
            ),
          ],
        ),
      );
    }
  }"""

content = re.sub(r'  Widget _buildResetCard\(\) \{.*\}', build_reset_card, content, flags=re.DOTALL)

# Let's add services import
if "import 'package:flutter/services.dart';" not in content:
    content = content.replace("import 'package:flutter/material.dart';", "import 'package:flutter/material.dart';\\nimport 'package:flutter/services.dart';")

# fix the copy button inside buildRecoverCard
content = content.replace("// clipboard not imported? let's assume it works since it's from services\\n                // wait, I need to import services? Yes, `import 'package:flutter/services.dart';`\\n                // Let's add that to imports if needed. I will add it.", "Clipboard.setData(ClipboardData(text: _recoveredPrivateKey!));\\n                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Private Key disalin')));")

with open("lib/screens/auth/login_screen.dart", "w", encoding="utf-8") as f:
    f.write(content)
