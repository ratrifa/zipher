import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/utils/file_download_util.dart';
import '../../models/file_item.dart';
import '../../providers/starred_provider.dart';
import '../widgets/confirm_dialog.dart';
import '../widgets/file_card.dart';
import '../widgets/rename_dialog.dart';

class StarredScreen extends ConsumerStatefulWidget {
  const StarredScreen({super.key});

  @override
  ConsumerState<StarredScreen> createState() => _StarredScreenState();
}

class _StarredScreenState extends ConsumerState<StarredScreen> {
  bool _isGrid = true;

  Future<void> _toggleStar(FileItem item) async {
    try {
      final ep = item.isFolder ? Endpoints.folderStar(item.id) : Endpoints.fileStar(item.id);
      await dio.post(ep);
      ref.invalidate(starredProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    }
  }

  Future<void> _rename(FileItem item) async {
    final name = await showRenameDialog(context, currentName: item.name);
    if (name == null) return;
    try {
      final ep = item.isFolder ? Endpoints.folderById(item.id) : Endpoints.fileById(item.id);
      await dio.patch(ep, data: {'name': name});
      ref.invalidate(starredProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    }
  }

  Future<void> _delete(FileItem item) async {
    final ok = await showConfirmDialog(context, title: 'Hapus', content: 'Hapus "${item.name}"?');
    if (!ok) return;
    try {
      final ep = item.isFolder ? Endpoints.folderById(item.id) : Endpoints.fileById(item.id);
      await dio.delete(ep);
      ref.invalidate(starredProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiClient.errorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final starred = ref.watch(starredProvider);

    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: starred.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text(ApiClient.errorMessage(e))),
            data: (items) => items.isEmpty ? _buildEmpty() : _buildList(items),
          ),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFe5e7eb))),
      ),
      child: Row(
        children: [
          const Text('Starred', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const Spacer(),
          IconButton(
            icon: Icon(_isGrid ? Icons.view_list_rounded : Icons.grid_view_rounded, size: 20),
            onPressed: () => setState(() => _isGrid = !_isGrid),
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }

  Widget _buildList(List<FileItem> items) {
    if (_isGrid) {
      return RefreshIndicator(
        onRefresh: () async => ref.invalidate(starredProvider),
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.9,
          ),
          itemCount: items.length,
          itemBuilder: (_, i) => FileCard(
            item: items[i], mode: FileCardMode.grid, 
            onTap: items[i].isFolder ? () {} : () => FileDownloadUtil.downloadAndOpenFile(context, items[i]),
            onDownload: items[i].isFolder ? null : () => FileDownloadUtil.downloadToDevice(context, items[i]),
            onRename: () => _rename(items[i]),
            onStar: () => _toggleStar(items[i]),
            onDelete: () => _delete(items[i]),
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(starredProvider),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (_, i) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: FileCard(
            item: items[i], mode: FileCardMode.list,
            onTap: items[i].isFolder ? () {} : () => FileDownloadUtil.downloadAndOpenFile(context, items[i]),
            onDownload: items[i].isFolder ? null : () => FileDownloadUtil.downloadToDevice(context, items[i]),
            onRename: () => _rename(items[i]),
            onStar: () => _toggleStar(items[i]),
            onDelete: () => _delete(items[i]),
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
          Icon(Icons.star_outline_rounded, size: 64, color: Color(0xFFe5e7eb)),
          SizedBox(height: 16),
          Text('Belum ada file berbintang', style: TextStyle(color: Color(0xFF9ca3af), fontSize: 15)),
          SizedBox(height: 8),
          Text('Beri bintang pada file untuk akses cepat', style: TextStyle(color: Color(0xFFd1d5db), fontSize: 13)),
        ],
      ),
    );
  }
}
