import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../models/file_item.dart';

final _recentFilterProvider = StateProvider<String>((ref) => 'all');

// No deduplication: every activity row is shown, just like the web app.
final _recentProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final res = await dio.get(Endpoints.recent);
  final items = res.data['data'] as List<dynamic>? ?? [];

  return items.map((e) {
    final map = e as Map<String, dynamic>;
    return FileItem.fromJson({
      'id': map['id']?.toString() ?? '',
      'name': map['file_name']?.toString() ?? '',
      'mime_type': map['mime_type']?.toString(),
      'type': (map['is_folder'] == true || map['is_folder'] == 1) ? 'folder' : 'file',
      'updated_at': map['created_at']?.toString() ?? '',
      'activityAction': map['action']?.toString(),
      'location': map['location']?.toString(),
    });
  }).toList();
});

// Action -> Indonesian label + icon + colors, matching the web app palette.
typedef _ActionStyle = ({String label, IconData icon, Color color, Color bg});

const _actionConfig = <String, _ActionStyle>{
  'opened':     (label: 'Dibuka',           icon: Icons.visibility_rounded,        color: Color(0xFF0E7490), bg: Color(0xFFECFEFF)),
  'downloaded': (label: 'Diunduh',          icon: Icons.download_rounded,          color: Color(0xFF4338CA), bg: Color(0xFFEEF2FF)),
  'uploaded':   (label: 'Diunggah',         icon: Icons.upload_rounded,            color: Color(0xFF15803D), bg: Color(0xFFF0FDF4)),
  'created':    (label: 'Dibuat',           icon: Icons.create_new_folder_rounded, color: Color(0xFF047857), bg: Color(0xFFECFDF5)),
  'renamed':    (label: 'Direname',         icon: Icons.edit_rounded,              color: Color(0xFFB45309), bg: Color(0xFFFFFBEB)),
  'moved':      (label: 'Dipindah',         icon: Icons.drive_file_move_rounded,   color: Color(0xFFC2410C), bg: Color(0xFFFFF7ED)),
  'shared':     (label: 'Dibagi',           icon: Icons.share_rounded,             color: Color(0xFF7E22CE), bg: Color(0xFFFAF5FF)),
  'trashed':    (label: 'Dihapus',          icon: Icons.delete_rounded,            color: Color(0xFFB91C1C), bg: Color(0xFFFEF2F2)),
  'deleted':    (label: 'Dihapus Permanen', icon: Icons.delete_forever_rounded,    color: Color(0xFF991B1B), bg: Color(0xFFFEE2E2)),
};

_ActionStyle _styleFor(String? action) =>
    _actionConfig[action] ?? _actionConfig['opened']!;

// Icon background/foreground per file kind, matching the web app palette.
typedef _KindStyle = ({Color color, Color bg});

_KindStyle _kindStyle(FileItem item) {
  final mime = item.mimeType?.toLowerCase() ?? '';
  switch (item.fileType) {
    case FileType.folder:       return (color: const Color(0xFF1D4ED8), bg: const Color(0xFFDBEAFE));
    case FileType.spreadsheet:  return (color: const Color(0xFF047857), bg: const Color(0xFFD1FAE5));
    case FileType.image:        return (color: const Color(0xFF6D28D9), bg: const Color(0xFFEDE9FE));
    case FileType.presentation: return (color: const Color(0xFFBE123C), bg: const Color(0xFFFFE4E6));
    case FileType.code:         return (color: const Color(0xFF334155), bg: const Color(0xFFF1F5F9));
    case FileType.document:
      // Web app splits PDF (orange) from other docs (sky blue).
      if (mime.contains('pdf')) return (color: const Color(0xFFC2410C), bg: const Color(0xFFFFEDD5));
      return (color: const Color(0xFF0369A1), bg: const Color(0xFFE0F2FE));
    case FileType.other:        return (color: const Color(0xFF0369A1), bg: const Color(0xFFE0F2FE));
  }
}

const _filters = [
  ('all', 'Semua'),
  ('opened', 'Dibuka'),
  ('downloaded', 'Diunduh'),
  ('uploaded', 'Diunggah'),
  ('created', 'Dibuat'),
  ('renamed', 'Direname'),
  ('moved', 'Dipindah'),
  ('shared', 'Dibagi'),
  ('trashed', 'Dihapus'),
  ('deleted', 'Dihapus Permanen'),
];

class RecentScreen extends ConsumerWidget {
  const RecentScreen({super.key});

  // Same period buckets as the web app.
  String _groupLabel(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(date.year, date.month, date.day);
    final diff = today.difference(d).inDays;
    if (diff == 0) return 'Hari ini';
    if (diff <= 7) return 'Minggu ini';
    if (date.year == now.year && date.month == now.month) return 'Awal bulan ini';
    if (date.year == now.year && date.month == now.month - 1) return 'Bulan lalu';
    if (date.year == now.year) return 'Awal tahun ini';
    return 'Tahun lalu';
  }

  String _accessedAt(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} menit lalu';
    if (diff.inHours < 24) return DateFormat.Hm().format(date);
    if (diff.inDays == 1) return 'Kemarin';
    return DateFormat('d MMM yyyy').format(date);
  }

  String _filterLabel(String value) =>
      _filters.firstWhere((f) => f.$1 == value).$2;

  Widget _buildFilters(BuildContext context, WidgetRef ref) {
    final currentFilter = ref.watch(_recentFilterProvider);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            currentFilter == 'all' ? 'Semua Aktivitas' : 'Aktivitas: ${_filterLabel(currentFilter)}',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          PopupMenuButton<String>(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            position: PopupMenuPosition.under,
            onSelected: (val) => ref.read(_recentFilterProvider.notifier).state = val,
            itemBuilder: (_) => _filters.map((f) => PopupMenuItem(
              value: f.$1,
              child: Row(
                children: [
                  Text(f.$2, style: TextStyle(
                    fontWeight: f.$1 == currentFilter ? FontWeight.w600 : FontWeight.normal,
                    color: f.$1 == currentFilter ? Colors.black : Colors.black87,
                  )),
                  if (f.$1 == currentFilter) ...[
                    const Spacer(),
                    const Icon(Icons.check_rounded, size: 18, color: Colors.black),
                  ],
                ],
              ),
            )).toList(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(20),
                color: Colors.white,
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.filter_list_rounded, size: 18, color: Colors.black87),
                  SizedBox(width: 6),
                  Text('Filter', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionBadge(String? action) {
    final s = _styleFor(action);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: s.bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: s.color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(s.icon, size: 14, color: s.color),
          const SizedBox(width: 4),
          Text(s.label, style: TextStyle(color: s.color, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  // Display-only: no tap handler. Recent is a read-only activity log.
  Widget _buildActivityTile(BuildContext context, FileItem item) {
    final kind = _kindStyle(item);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: kind.bg,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(item.icon, color: kind.color, size: 24),
        ),
        title: Text(
          item.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          '${item.location ?? 'My Files'} • ${_accessedAt(item.updatedAt)}',
          style: const TextStyle(color: Colors.grey, fontSize: 12),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: _buildActionBadge(item.activityAction),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recent = ref.watch(_recentProvider);
    final filter = ref.watch(_recentFilterProvider);

    return Column(
      children: [
        const SizedBox(height: 12),
        _buildFilters(context, ref),
        const SizedBox(height: 4),
        Expanded(
          child: recent.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text(ApiClient.errorMessage(e))),
            data: (items) {
              final filteredItems = filter == 'all'
                  ? items
                  : items.where((i) => i.activityAction == filter).toList();

              if (filteredItems.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.history_rounded, size: 64, color: Color(0xFFe5e7eb)),
                      const SizedBox(height: 16),
                      Text(
                        filter == 'all' ? 'Belum ada aktivitas' : 'Belum ada aktivitas "${_filterLabel(filter)}"',
                        style: const TextStyle(color: Color(0xFF9ca3af), fontSize: 15),
                      ),
                    ],
                  ),
                );
              }

              // Group by period label, preserving server (newest-first) order.
              final grouped = <String, List<FileItem>>{};
              for (final item in filteredItems) {
                grouped.putIfAbsent(_groupLabel(item.updatedAt), () => []).add(item);
              }

              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(_recentProvider),
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    for (final entry in grouped.entries) ...[
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8, top: 4),
                        child: Text(
                          entry.key.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF9ca3af),
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                      ...entry.value.map((item) => _buildActivityTile(context, item)),
                    ],
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
