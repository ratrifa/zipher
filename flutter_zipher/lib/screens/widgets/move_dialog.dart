import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../models/file_item.dart';

/// Folder-browser dialog used to move a single file or folder.
///
/// Mirrors the web app: the user drills into the folder tree starting from the
/// root ("My Files"), and the currently browsed folder becomes the move target.
/// The item being moved is hidden from the listing so it cannot be opened (which
/// also prevents selecting it as its own destination); the backend additionally
/// rejects moving a folder into itself or any of its descendants.
///
/// Returns `true` if the item was moved, otherwise `null`/`false`.
class MoveDialog extends StatefulWidget {
  const MoveDialog({super.key, required this.item});

  final FileItem item;

  @override
  State<MoveDialog> createState() => _MoveDialogState();
}

class _MoveDialogState extends State<MoveDialog> {
  // Breadcrumb path. The last entry's id is the current move target
  // (null == root / "My Files").
  final List<({String? id, String name})> _stack = [(id: null, name: 'My Files')];

  List<FileItem> _folders = [];
  bool _loading = true;
  bool _moving = false;
  String? _error;

  String? get _targetId => _stack.last.id;

  // No-op when the target equals the item's current parent.
  bool get _isNoop => _targetId == widget.item.folderId;

  @override
  void initState() {
    super.initState();
    _loadFolders();
  }

  Future<void> _loadFolders() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await dio.get(
        Endpoints.folders,
        queryParameters: {if (_targetId != null) 'parent_id': _targetId},
      );
      final data = (res.data['data'] as List<dynamic>? ?? [])
          .map((e) => FileItem.fromJson(e as Map<String, dynamic>, isFolder: true))
          // Hide the folder being moved so it can't be entered/selected.
          .where((f) => f.id != widget.item.id)
          .toList();
      if (!mounted) return;
      setState(() { _folders = data; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = ApiClient.errorMessage(e); _loading = false; });
    }
  }

  void _enterFolder(FileItem folder) {
    setState(() => _stack.add((id: folder.id, name: folder.name)));
    _loadFolders();
  }

  void _jumpTo(int index) {
    if (index >= _stack.length - 1) return;
    setState(() => _stack.removeRange(index + 1, _stack.length));
    _loadFolders();
  }

  Future<void> _submit() async {
    if (_isNoop) return;
    setState(() { _moving = true; _error = null; });
    try {
      await dio.post(Endpoints.contentsMove, data: {
        'file_ids': widget.item.isFolder ? [] : [widget.item.id],
        'folder_ids': widget.item.isFolder ? [widget.item.id] : [],
        'target_folder_id': _targetId,
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = ApiClient.errorMessage(e); _moving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        'Pindahkan ${widget.item.isFolder ? 'Folder' : 'File'}',
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
      ),
      contentPadding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      content: SizedBox(
        width: 400,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            RichText(
              text: TextSpan(
                style: const TextStyle(color: Color(0xFF6b7280), fontSize: 13),
                children: [
                  const TextSpan(text: 'Pilih folder tujuan untuk '),
                  TextSpan(
                    text: widget.item.name,
                    style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1a1a1a)),
                  ),
                  const TextSpan(text: '.'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFe5e7eb)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: [
                  _buildBreadcrumb(),
                  const Divider(height: 1, color: Color(0xFFe5e7eb)),
                  SizedBox(height: 240, child: _buildList()),
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: const TextStyle(color: Color(0xFFdc2626), fontSize: 12)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _moving ? null : () => Navigator.of(context).pop(false),
          child: const Text('Batal', style: TextStyle(color: Colors.grey)),
        ),
        ElevatedButton(
          onPressed: (_moving || _isNoop) ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1a1a1a),
            foregroundColor: Colors.white,
          ),
          child: _moving
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Pindahkan ke Sini'),
        ),
      ],
    );
  }

  Widget _buildBreadcrumb() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          children: [
            for (int i = 0; i < _stack.length; i++) ...[
              if (i > 0)
                const Icon(Icons.chevron_right_rounded, size: 16, color: Color(0xFF9ca3af)),
              TextButton.icon(
                onPressed: i == _stack.length - 1 ? null : () => _jumpTo(i),
                icon: i == 0
                    ? const Icon(Icons.home_rounded, size: 16)
                    : const SizedBox.shrink(),
                label: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 110),
                  child: Text(
                    _stack[i].name,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      color: i == _stack.length - 1 ? const Color(0xFF1a1a1a) : const Color(0xFF6b7280),
                      fontWeight: i == _stack.length - 1 ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                ),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  minimumSize: const Size(0, 32),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildList() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_folders.isEmpty) {
      return const Center(
        child: Text('Tidak ada folder di sini',
            style: TextStyle(color: Color(0xFF9ca3af), fontSize: 13)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(4),
      itemCount: _folders.length,
      itemBuilder: (_, i) {
        final f = _folders[i];
        return InkWell(
          onTap: () => _enterFolder(f),
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
            child: Row(
              children: [
                const Icon(Icons.folder_rounded, size: 18, color: Color(0xFF3b82f6)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(f.name,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13)),
                ),
                const Icon(Icons.chevron_right_rounded, size: 16, color: Color(0xFF9ca3af)),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Shows the move dialog. Returns `true` if the item was moved.
Future<bool> showMoveDialog(BuildContext context, FileItem item) async {
  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (_) => MoveDialog(item: item),
  );
  return result ?? false;
}
