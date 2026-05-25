import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../models/file_item.dart';
import '../../providers/trash_provider.dart';
import '../widgets/confirm_dialog.dart';
import '../widgets/file_card.dart';

class TrashScreen extends ConsumerStatefulWidget {
  const TrashScreen({super.key});

  @override
  ConsumerState<TrashScreen> createState() => _TrashScreenState();
}

class _TrashScreenState extends ConsumerState<TrashScreen> {
  bool _loading = false;

  Future<void> _restore(FileItem item) async {
    try {
      final ep = item.isFolder ? Endpoints.folderRestore(item.id) : Endpoints.fileRestore(item.id);
      await dio.post(ep);
      ref.invalidate(trashProvider);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('"${item.name}" dipulihkan')),
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    }
  }

  Future<void> _forceDelete(FileItem item) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Hapus Permanen',
      content: '"${item.name}" akan dihapus selamanya. Tindakan ini tidak bisa dibatalkan.',
      confirmLabel: 'Hapus Permanen',
    );
    if (!ok) return;
    try {
      final ep = item.isFolder ? Endpoints.folderForceDelete(item.id) : Endpoints.fileForceDelete(item.id);
      await dio.delete(ep);
      ref.invalidate(trashProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    }
  }

  Future<void> _restoreAll(List<FileItem> items) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Pulihkan Semua',
      content: 'Semua file dan folder di Trash akan dipulihkan.',
      confirmLabel: 'Pulihkan Semua',
      isDestructive: false,
    );
    if (!ok) return;
    setState(() => _loading = true);
    try {
      await Future.wait(items.map((item) {
        final ep = item.isFolder ? Endpoints.folderRestore(item.id) : Endpoints.fileRestore(item.id);
        return dio.post(ep);
      }));
      ref.invalidate(trashProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deleteAll(List<FileItem> items) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Hapus Semua Permanen',
      content: 'Semua file dan folder di Trash akan dihapus selamanya. Tidak bisa dibatalkan!',
      confirmLabel: 'Hapus Semua',
    );
    if (!ok) return;
    setState(() => _loading = true);
    try {
      await Future.wait(items.map((item) {
        final ep = item.isFolder ? Endpoints.folderForceDelete(item.id) : Endpoints.fileForceDelete(item.id);
        return dio.delete(ep);
      }));
      ref.invalidate(trashProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final trash = ref.watch(trashProvider);

    return Column(
      children: [
        trash.whenData((items) => items.isNotEmpty
            ? _buildActions(items)
            : const SizedBox.shrink()).valueOrNull ?? const SizedBox.shrink(),
        Expanded(
          child: trash.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text(ApiClient.errorMessage(e))),
            data: (items) => items.isEmpty ? _buildEmpty() : _buildList(items),
          ),
        ),
        if (_loading) const LinearProgressIndicator(),
      ],
    );
  }

  Widget _buildActions(List<FileItem> items) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFe5e7eb))),
      ),
      child: Row(
        children: [
          const Text('Trash', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const Spacer(),
          OutlinedButton.icon(
            onPressed: () => _restoreAll(items),
            icon: const Icon(Icons.restore_rounded, size: 16),
            label: const Text('Pulihkan Semua', style: TextStyle(fontSize: 12)),
            style: OutlinedButton.styleFrom(
              minimumSize: Size.zero,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: () => _deleteAll(items),
            icon: const Icon(Icons.delete_forever_rounded, size: 16, color: Color(0xFFdc2626)),
            label: const Text('Hapus Semua', style: TextStyle(fontSize: 12, color: Color(0xFFdc2626))),
            style: OutlinedButton.styleFrom(
              minimumSize: Size.zero,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              side: const BorderSide(color: Color(0xFFfca5a5)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(List<FileItem> items) {
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(trashProvider),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (_, i) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: FileCard(
            item: items[i],
            mode: FileCardMode.list,
            inTrash: true,
            onTap: () {},
            onRestore: () => _restore(items[i]),
            onDelete: () => _forceDelete(items[i]),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.delete_outline_rounded, size: 64, color: Color(0xFFe5e7eb)),
          SizedBox(height: 16),
          Text('Trash kosong', style: TextStyle(color: Color(0xFF9ca3af), fontSize: 15)),
          SizedBox(height: 8),
          Text('File yang dihapus akan muncul di sini', style: TextStyle(color: Color(0xFFd1d5db), fontSize: 13)),
        ],
      ),
    );
  }
}
