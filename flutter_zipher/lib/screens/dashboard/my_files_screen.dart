import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/crypto/crypto_service.dart';
import '../../core/storage/secure_storage.dart';
import '../../models/file_item.dart';
import '../../providers/files_provider.dart';
import '../widgets/confirm_dialog.dart';
import '../widgets/file_card.dart';
import '../widgets/rename_dialog.dart';
import '../widgets/share_bottom_sheet.dart';

class MyFilesScreen extends ConsumerStatefulWidget {
  const MyFilesScreen({super.key});

  @override
  ConsumerState<MyFilesScreen> createState() => _MyFilesScreenState();
}

class _MyFilesScreenState extends ConsumerState<MyFilesScreen> {
  final List<({int? id, String name})> _breadcrumb = [
    (id: null, name: 'My Files'),
  ];
  bool _isGrid = true;

  int? get _currentFolderId => _breadcrumb.last.id;

  void _navigateToFolder(FileItem folder) {
    setState(() {
      _breadcrumb.add((id: folder.id, name: folder.name));
      ref.read(currentFolderIdProvider.notifier).state = folder.id;
    });
  }

  void _navigateToBreadcrumb(int index) {
    if (index >= _breadcrumb.length - 1) return;
    setState(() {
      _breadcrumb.removeRange(index + 1, _breadcrumb.length);
      ref.read(currentFolderIdProvider.notifier).state = _breadcrumb.last.id;
    });
  }

  Future<void> _createFolder() async {
    final name = await showRenameDialog(context, currentName: 'Folder Baru');
    if (name == null || name.isEmpty) return;
    try {
      await dio.post(Endpoints.folders, data: {
        'name': name,
        if (_currentFolderId != null) 'parent_id': _currentFolderId,
      });
      ref.invalidate(contentsProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.errorMessage(e))),
      );
    }
  }

  Future<void> _uploadFile() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true);
    if (result == null || result.files.isEmpty) return;

    for (final file in result.files) {
      if (file.bytes == null && file.path == null) continue;
      try {
        final privateKeyPem = await SecureStorage.instance.getPrivateKey();
        if (privateKeyPem == null) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Private key tidak ditemukan')),
          );
          return;
        }

        // Read file bytes
        final bytes = file.bytes ?? await _readFilePath(file.path!);

        // Encrypt file
        final enc = await CryptoService.encryptFile(bytes);

        // Get user's public key to encrypt AES key
        final res = await dio.get(Endpoints.me);
        final publicKey = res.data['user']['public_key'] as String;
        final encryptedKey = await CryptoService.encryptAesKeyWithRsa(enc.aesKey, publicKey);

        // Upload
        final formData = FormData.fromMap({
          'file': MultipartFile.fromBytes(enc.encrypted, filename: file.name),
          'encrypted_key': _encodeBase64(encryptedKey),
          'iv': _encodeBase64(enc.iv),
          if (_currentFolderId != null) 'folder_id': _currentFolderId,
        });
        await dio.post(Endpoints.files, data: formData);
        ref.invalidate(contentsProvider);
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal upload ${file.name}: ${ApiClient.errorMessage(e)}')),
        );
      }
    }
  }

  Future<Uint8List> _readFilePath(String path) async {
    final file = await MultipartFile.fromFile(path);
    final bytes = await file.finalize().fold(<int>[], (a, b) => [...a, ...b]);
    return Uint8List.fromList(bytes);
  }

  static String _encodeBase64(List<int> bytes) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    final sb = StringBuffer();
    for (var i = 0; i < bytes.length; i += 3) {
      final b0 = bytes[i];
      final b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      final b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      sb.write(chars[(b0 >> 2) & 0x3f]);
      sb.write(chars[((b0 << 4) | (b1 >> 4)) & 0x3f]);
      sb.write(i + 1 < bytes.length ? chars[((b1 << 2) | (b2 >> 6)) & 0x3f] : '=');
      sb.write(i + 2 < bytes.length ? chars[b2 & 0x3f] : '=');
    }
    return sb.toString();
  }

  Future<void> _renameItem(FileItem item) async {
    final newName = await showRenameDialog(context, currentName: item.name);
    if (newName == null || newName.isEmpty) return;
    try {
      final endpoint = item.isFolder ? Endpoints.folderById(item.id) : Endpoints.fileById(item.id);
      await dio.patch(endpoint, data: {'name': newName});
      ref.invalidate(contentsProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.errorMessage(e))),
      );
    }
  }

  Future<void> _deleteItem(FileItem item) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Hapus ${item.isFolder ? 'Folder' : 'File'}',
      content: 'Yakin ingin menghapus "${item.name}"?',
    );
    if (!ok) return;
    try {
      final endpoint = item.isFolder ? Endpoints.folderById(item.id) : Endpoints.fileById(item.id);
      await dio.delete(endpoint);
      ref.invalidate(contentsProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.errorMessage(e))),
      );
    }
  }

  Future<void> _toggleStar(FileItem item) async {
    try {
      final endpoint = item.isFolder ? Endpoints.folderStar(item.id) : Endpoints.fileStar(item.id);
      await dio.post(endpoint);
      ref.invalidate(contentsProvider);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.errorMessage(e))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final contents = ref.watch(contentsProvider(_currentFolderId));

    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: contents.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => _buildError(e),
            data: (items) => items.isEmpty ? _buildEmpty() : _buildContent(items),
          ),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFe5e7eb))),
      ),
      child: Row(
        children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (int i = 0; i < _breadcrumb.length; i++) ...[
                    if (i > 0)
                      const Icon(Icons.chevron_right_rounded, size: 18, color: Color(0xFF9ca3af)),
                    GestureDetector(
                      onTap: () => _navigateToBreadcrumb(i),
                      child: Text(
                        _breadcrumb[i].name,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: i == _breadcrumb.length - 1 ? FontWeight.w600 : FontWeight.normal,
                          color: i == _breadcrumb.length - 1 ? const Color(0xFF1a1a1a) : const Color(0xFF9ca3af),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          IconButton(
            icon: Icon(_isGrid ? Icons.view_list_rounded : Icons.grid_view_rounded, size: 20),
            onPressed: () => setState(() => _isGrid = !_isGrid),
            visualDensity: VisualDensity.compact,
          ),
          _buildNewMenu(),
        ],
      ),
    );
  }

  Widget _buildNewMenu() {
    return PopupMenuButton<String>(
      onSelected: (v) {
        if (v == 'folder') _createFolder();
        if (v == 'upload') _uploadFile();
      },
      itemBuilder: (_) => [
        PopupMenuItem(
          value: 'folder',
          child: Row(children: [
            const Icon(Icons.create_new_folder_rounded, size: 18, color: Color(0xFF6b7280)),
            const SizedBox(width: 12),
            const Text('Buat Folder'),
          ]),
        ),
        PopupMenuItem(
          value: 'upload',
          child: Row(children: [
            const Icon(Icons.upload_rounded, size: 18, color: Color(0xFF6b7280)),
            const SizedBox(width: 12),
            const Text('Upload File'),
          ]),
        ),
      ],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1a1a1a),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.add_rounded, color: Colors.white, size: 18),
            SizedBox(width: 4),
            Text('Baru', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(List<FileItem> items) {
    if (_isGrid) {
      return RefreshIndicator(
        onRefresh: () async => ref.invalidate(contentsProvider),
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.9,
          ),
          itemCount: items.length,
          itemBuilder: (_, i) => FileCard(
            item: items[i],
            mode: FileCardMode.grid,
            onTap: () => items[i].isFolder ? _navigateToFolder(items[i]) : null,
            onRename: () => _renameItem(items[i]),
            onDelete: () => _deleteItem(items[i]),
            onShare: items[i].isFolder ? null : () => showShareBottomSheet(context, items[i]),
            onStar: () => _toggleStar(items[i]),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(contentsProvider),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (_, i) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: FileCard(
            item: items[i],
            mode: FileCardMode.list,
            onTap: () => items[i].isFolder ? _navigateToFolder(items[i]) : null,
            onRename: () => _renameItem(items[i]),
            onDelete: () => _deleteItem(items[i]),
            onShare: items[i].isFolder ? null : () => showShareBottomSheet(context, items[i]),
            onStar: () => _toggleStar(items[i]),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(contentsProvider),
      child: ListView(
        children: const [
          SizedBox(height: 120),
          Icon(Icons.folder_open_rounded, size: 64, color: Color(0xFFe5e7eb)),
          SizedBox(height: 16),
          Text('Folder kosong', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF9ca3af), fontSize: 15)),
          SizedBox(height: 8),
          Text('Upload file atau buat folder baru', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFFd1d5db), fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildError(Object e) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded, size: 48, color: Color(0xFFe5e7eb)),
          const SizedBox(height: 12),
          Text(ApiClient.errorMessage(e), style: const TextStyle(color: Color(0xFF9ca3af))),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () => ref.invalidate(contentsProvider),
            child: const Text('Coba Lagi'),
          ),
        ],
      ),
    );
  }
}
