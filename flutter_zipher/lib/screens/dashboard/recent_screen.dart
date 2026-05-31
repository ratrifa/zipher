import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../models/file_item.dart';
import '../widgets/file_card.dart';

final _recentProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final res = await dio.get(Endpoints.recent);
  debugPrint('[RECENT] raw keys: ${res.data?.keys}');
  debugPrint('[RECENT] data length: ${(res.data['data'] as List?)?.length}');
  final items = res.data['data'] as List<dynamic>? ?? [];
  return items.map((e) {
    final map = e as Map<String, dynamic>;
    // Activity records have different fields than FileItem, map them explicitly
    return FileItem.fromJson({
      'id': map['file_id']?.toString() ?? map['id']?.toString() ?? '',
      'name': map['file_name']?.toString() ?? '',
      'mime_type': map['mime_type']?.toString(),
      'type': (map['is_folder'] == true || map['is_folder'] == 1) ? 'folder' : 'file',
      'updated_at': map['created_at']?.toString() ?? '',
    });
  }).toList();
});

class RecentScreen extends ConsumerWidget {
  const RecentScreen({super.key});

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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recent = ref.watch(_recentProvider);

    return recent.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text(ApiClient.errorMessage(e))),
      data: (items) {
        if (items.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.access_time_rounded, size: 64, color: Color(0xFFe5e7eb)),
                SizedBox(height: 16),
                Text('Belum ada aktivitas', style: TextStyle(color: Color(0xFF9ca3af), fontSize: 15)),
              ],
            ),
          );
        }

        // Group by date label
        final grouped = <String, List<FileItem>>{};
        for (final item in items) {
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
                    entry.key,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF9ca3af),
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                ...entry.value.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: FileCard(item: item, mode: FileCardMode.list, onTap: () {}),
                )),
              ],
            ],
          ),
        );
      },
    );
  }
}
