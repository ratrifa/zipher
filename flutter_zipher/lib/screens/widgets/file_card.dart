import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/file_item.dart';

enum FileCardMode { grid, list }

class FileCard extends StatelessWidget {
  final FileItem item;
  final FileCardMode mode;
  final VoidCallback onTap;
  final VoidCallback? onRename;
  final VoidCallback? onDownload;
  final VoidCallback? onShare;
  final VoidCallback? onDelete;
  final VoidCallback? onRestore;
  final VoidCallback? onStar;
  final VoidCallback? onMove;
  final VoidCallback? onReport;
  final bool inTrash;
  final bool inShared;

  const FileCard({
    super.key,
    required this.item,
    required this.onTap,
    this.mode = FileCardMode.grid,
    this.onRename,
    this.onDownload,
    this.onShare,
    this.onDelete,
    this.onRestore,
    this.onStar,
    this.onMove,
    this.onReport,
    this.inTrash = false,
    this.inShared = false,
  });

  @override
  Widget build(BuildContext context) {
    return mode == FileCardMode.grid ? _buildGrid(context) : _buildList(context);
  }

  Widget _buildGrid(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _buildIcon(size: 40),
                  const Spacer(),
                  if (item.isStarred)
                    const Icon(Icons.star_rounded, size: 16, color: Color(0xFFfbbf24)),
                  _buildMenu(context),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                item.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                item.displayMeta,
                style: const TextStyle(fontSize: 11, color: Color(0xFF9ca3af)),
              ),
              if (item.tags.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  children: item.tags
                      .take(3)
                      .map((t) => Chip(label: Text(t)))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildList(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: _buildIcon(size: 36),
        title: Text(
          item.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          '${item.displayMeta} · ${DateFormat('d MMM yyyy').format(item.updatedAt)}',
          style: const TextStyle(fontSize: 12, color: Color(0xFF9ca3af)),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (item.isStarred)
              const Icon(Icons.star_rounded, size: 16, color: Color(0xFFfbbf24)),
            _buildMenu(context),
          ],
        ),
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
      ),
    );
  }

  Widget _buildIcon({required double size}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: item.iconBackground,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(item.icon, color: item.iconColor, size: size * 0.55),
    );
  }

  Widget _buildMenu(BuildContext context) {
    final menuItems = <PopupMenuEntry<String>>[];

    if (!inTrash) {
      if (!item.isFolder) menuItems.add(_menuItem('open', Icons.open_in_new_rounded, 'Buka'));
      if (onDownload != null && !item.isFolder) {
        menuItems.add(_menuItem('download', Icons.download_rounded, 'Unduh'));
      }
      if (onShare != null && !item.isFolder) {
        menuItems.add(_menuItem('share', Icons.share_rounded, 'Bagikan'));
      }
      if (onRename != null) menuItems.add(_menuItem('rename', Icons.edit_rounded, 'Ganti Nama'));
      if (onMove != null) menuItems.add(_menuItem('move', Icons.drive_file_move_rounded, 'Pindahkan'));
      if (onStar != null) {
        menuItems.add(_menuItem(
          'star',
          item.isStarred ? Icons.star_rounded : Icons.star_outline_rounded,
          item.isStarred ? 'Hapus Bintang' : 'Beri Bintang',
        ));
      }
      if (onDelete != null) {
        menuItems.add(const PopupMenuDivider());
        menuItems.add(_menuItem('delete', Icons.delete_outline_rounded, 'Hapus', isDestructive: true));
      }
    } else {
      if (onRestore != null) menuItems.add(_menuItem('restore', Icons.restore_rounded, 'Pulihkan'));
      if (onDelete != null) {
        menuItems.add(_menuItem('delete', Icons.delete_forever_rounded, 'Hapus Permanen', isDestructive: true));
      }
    }

    if (inShared && onReport != null) {
      menuItems.add(const PopupMenuDivider());
      menuItems.add(_menuItem('report', Icons.flag_outlined, 'Laporkan', isDestructive: true));
    }

    if (menuItems.isEmpty) return const SizedBox.shrink();

    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert_rounded, size: 18, color: Color(0xFF9ca3af)),
      onSelected: (value) {
        switch (value) {
          case 'open': onTap();
          case 'download': onDownload?.call();
          case 'share': onShare?.call();
          case 'rename': onRename?.call();
          case 'move': onMove?.call();
          case 'star': onStar?.call();
          case 'restore': onRestore?.call();
          case 'delete': onDelete?.call();
          case 'report': onReport?.call();
        }
      },
      itemBuilder: (_) => menuItems,
    );
  }

  PopupMenuItem<String> _menuItem(String value, IconData icon, String label, {bool isDestructive = false}) {
    final color = isDestructive ? const Color(0xFFdc2626) : null;
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          Icon(icon, size: 18, color: color ?? const Color(0xFF6b7280)),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(fontSize: 14, color: color)),
        ],
      ),
    );
  }
}
