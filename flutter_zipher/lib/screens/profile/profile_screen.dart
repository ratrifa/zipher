import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/profile_provider.dart';
import '../widgets/private_key_dialog.dart';
import '../widgets/storage_bar.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: authState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(ApiClient.errorMessage(e))),
        data: (user) => user == null
            ? const SizedBox.shrink()
            : _ProfileBody(user: user),
      ),
    );
  }
}

class _ProfileBody extends ConsumerWidget {
  final User user;
  const _ProfileBody({required this.user});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      children: [
        _buildAvatarSection(context, ref),
        const Divider(height: 1),
        StorageBar(user: user),
        const Divider(height: 1),
        const SizedBox(height: 8),
        _buildSection('Akun', [
          _SettingRow(
            icon: Icons.person_outline_rounded,
            label: 'Username',
            value: user.username,
            onTap: () => _showEditDialog(context, ref, 'Username', user.username, (v) async {
              await ref.read(profileProvider.notifier).updateUsername(v);
            }),
          ),
          _SettingRow(
            icon: Icons.email_outlined,
            label: 'Email',
            value: user.email,
            onTap: () => _showEditDialog(context, ref, 'Email', user.email, (v) async {
              await ref.read(profileProvider.notifier).updateEmail(v);
            }),
          ),
          _SettingRow(
            icon: Icons.lock_outline_rounded,
            label: 'Password',
            value: '••••••••',
            onTap: () => _showChangePasswordDialog(context, ref),
          ),
          _SettingRow(
            icon: Icons.key_outlined,
            label: 'Pulihkan Kunci (Private Key)',
            value: 'Masukkan Seed Phrase',
            onTap: () => showPrivateKeyDialog(context),
          ),
        ]),
      ],
    );
  }

  Widget _buildAvatarSection(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 28),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => _pickAvatar(context, ref),
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: const Color(0xFF1a1a1a),
                  backgroundImage: user.avatar != null
                      ? CachedNetworkImageProvider(Endpoints.avatarUrl(user.avatar!))
                      : null,
                  child: user.avatar == null
                      ? Text(
                          user.initials,
                          style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w700),
                        )
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Color(0xFF1a1a1a),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 14),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(user.username, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(user.email, style: const TextStyle(fontSize: 14, color: Color(0xFF9ca3af))),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Text(
            title,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF9ca3af), letterSpacing: 0.5),
          ),
        ),
        ...children,
      ],
    );
  }

  Future<void> _pickAvatar(BuildContext context, WidgetRef ref) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (image == null) return;
    try {
      await ref.read(profileProvider.notifier).uploadAvatar(File(image.path));
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Avatar diperbarui')),
      );
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.errorMessage(e))),
      );
    }
  }

  void _showEditDialog(
    BuildContext context,
    WidgetRef ref,
    String label,
    String current,
    Future<void> Function(String) onSave,
  ) {
    final ctrl = TextEditingController(text: current);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Ubah $label', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: InputDecoration(labelText: label),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await onSave(ctrl.text.trim());
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('$label diperbarui')),
                );
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(ApiClient.errorMessage(e))),
                );
              }
            },
            child: const Text('Simpan', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context, WidgetRef ref) {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Ubah Password', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: currentCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password Saat Ini')),
            const SizedBox(height: 12),
            TextField(controller: newCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password Baru')),
            const SizedBox(height: 12),
            TextField(controller: confirmCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Konfirmasi Password Baru')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          TextButton(
            onPressed: () async {
              if (newCtrl.text != confirmCtrl.text) {
                ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Password tidak cocok')));
                return;
              }
              Navigator.pop(ctx);
              try {
                await ref.read(profileProvider.notifier).changePassword(
                  currentPassword: currentCtrl.text,
                  newPassword: newCtrl.text,
                );
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Password berhasil diubah')),
                );
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(ApiClient.errorMessage(e))),
                );
              }
            },
            child: const Text('Simpan', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _SettingRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  const _SettingRow({required this.icon, required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: const Color(0xFFf3f4f6),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 20, color: const Color(0xFF6b7280)),
      ),
      title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(value, style: const TextStyle(fontSize: 13, color: Color(0xFF9ca3af))),
      trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFFd1d5db)),
      onTap: onTap,
    );
  }
}
