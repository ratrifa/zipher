import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../core/utils/file_download_util.dart';
import '../../models/file_item.dart';

final _recentFilterProvider = StateProvider<String>((ref) => 'Semua');

final _recentProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final res = await dio.get(Endpoints.recent);
  final items = res.data['data'] as List<dynamic>? ?? [];
  
  final uniqueItems = <String, FileItem>{};
  
  for (final e in items) {
    final map = e as Map<String, dynamic>;
    final fileId = map['file_id']?.toString() ?? map['id']?.toString() ?? '';
    // Use file_id or id, whichever is available, to deduplicate
    if (!uniqueItems.containsKey(fileId) && fileId.isNotEmpty) {
      uniqueItems[fileId] = FileItem.fromJson({
        'id': fileId,
        'name': map['file_name']?.toString() ?? '',
        'mime_type': map['mime_type']?.toString(),
        'type': (map['is_folder'] == true || map['is_folder'] == 1) ? 'folder' : 'file',
        'updated_at': map['created_at']?.toString() ?? '',
        'activityAction': map['action']?.toString(),
        'location': map['location']?.toString(),
      });
    }
  }
  
  return uniqueItems.values.toList();
});

class RecentScreen extends ConsumerWidget {
  const RecentScreen({super.key});

  final filters = const [
    'Semua', 'Dibuka', 'Diunduh', 'Diunggah', 'Dibuat', 
    'Direname', 'Dipindah', 'Dibagi', 'Dihapus', 'Dihapus Permanen'
  ];

  String _groupLabel(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(date.year, date.month, date.day);
    final diff = today.difference(d).inDays;
    if (diff == 0) return 'Hari Ini';
    if (diff == 1) return 'Kemarin';
    if (diff < 7) return 'Minggu Ini';
    return DateFormat('MMMM yyyy').format(date);
  }

  Widget _buildFilters(BuildContext context, WidgetRef ref) {
    final currentFilter = ref.watch(_recentFilterProvider);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            currentFilter == 'Semua' ? 'Semua Aktivitas' : 'Aktivitas: $currentFilter',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          PopupMenuButton<String>(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            position: PopupMenuPosition.under,
            onSelected: (val) => ref.read(_recentFilterProvider.notifier).state = val,
            itemBuilder: (_) => filters.map((f) => PopupMenuItem(
              value: f,
              child: Row(
                children: [
                  Text(f, style: TextStyle(
                    fontWeight: f == currentFilter ? FontWeight.w600 : FontWeight.normal,
                    color: f == currentFilter ? Colors.black : Colors.black87,
                  )),
                  if (f == currentFilter) ...[
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

  Widget _buildActionBadge(String action) {
    Color color = Colors.grey;
    IconData icon = Icons.info_outline;
    
    if (action == 'Diunggah') { color = Colors.green; icon = Icons.upload_rounded; }
    else if (action == 'Dibuat') { color = Colors.green; icon = Icons.add_circle_outline_rounded; }
    else if (action == 'Diunduh') { color = Colors.blue; icon = Icons.download_rounded; }
    else if (action == 'Dibuka') { color = Colors.blue; icon = Icons.visibility_rounded; }
    else if (action == 'Direname') { color = Colors.orange; icon = Icons.edit_rounded; }
    else if (action == 'Dipindah') { color = Colors.orange; icon = Icons.drive_file_move_rounded; }
    else if (action == 'Dibagi') { color = Colors.purple; icon = Icons.share_rounded; }
    else if (action == 'Dihapus' || action == 'Dihapus Permanen') { color = Colors.red; icon = Icons.delete_outline_rounded; }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(action, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildActivityTile(BuildContext context, FileItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ListTile(
        onTap: item.isFolder ? () {} : () => FileDownloadUtil.downloadAndOpenFile(context, item),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: item.iconBackground,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(item.icon, color: item.iconColor, size: 24),
        ),
        title: Text(
          item.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Row(
          children: [
            Expanded(
              child: Text(
                '${item.location ?? 'My Files'} • ${DateFormat.Hm().format(item.updatedAt)}',
                style: const TextStyle(color: Colors.grey, fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        trailing: _buildActionBadge(item.activityAction ?? 'Aktivitas'),
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
              final filteredItems = filter == 'Semua' 
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
                        filter == 'Semua' ? 'Belum ada aktivitas' : 'Belum ada aktivitas "$filter"', 
                        style: const TextStyle(color: Color(0xFF9ca3af), fontSize: 15)
                      ),
                    ],
                  ),
                );
              }

              // Group by date label
              final grouped = <String, List<FileItem>>{};
              for (final item in filteredItems) {
                final label = _groupLabel(item.updatedAt);
                grouped.putIfAbsent(label, () => []).add(item);
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
