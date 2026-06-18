import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../../models/user.dart';

/// Storage breakdown by file category, mirroring the web "Storage Management"
/// dialog. Fetches /storage/breakdown and shows Documents / Photos / Videos /
/// Others with their share of used storage.
class _Category {
  const _Category(this.key, this.label, this.color, this.icon);
  final String key;
  final String label;
  final Color color;
  final IconData icon;
}

const _categories = [
  _Category('documents', 'Documents', Color(0xFF3b82f6), Icons.description_rounded),
  _Category('images', 'Photos', Color(0xFF8b5cf6), Icons.image_rounded),
  _Category('videos', 'Videos', Color(0xFFec4899), Icons.movie_rounded),
  _Category('others', 'Others', Color(0xFFf59e0b), Icons.insert_drive_file_rounded),
];

String _formatBytes(int bytes) {
  if (bytes < 1024) return '${bytes}B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}KB';
  if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)}GB';
}

class StorageBreakdownSheet extends StatefulWidget {
  const StorageBreakdownSheet({super.key, required this.user});

  final User user;

  @override
  State<StorageBreakdownSheet> createState() => _StorageBreakdownSheetState();
}

class _StorageBreakdownSheetState extends State<StorageBreakdownSheet> {
  Map<String, int>? _breakdown;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await dio.get(Endpoints.storageBreakdown);
      final raw = (res.data['data']?['breakdown'] as Map<String, dynamic>?) ?? {};
      final parsed = <String, int>{
        for (final c in _categories) c.key: _toInt(raw[c.key]),
      };
      if (!mounted) return;
      setState(() { _breakdown = parsed; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = ApiClient.errorMessage(e); _loading = false; });
    }
  }

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final used = widget.user.storageUsed;
    final limit = widget.user.storageLimit;
    final available = (limit - used) < 0 ? 0 : limit - used;
    final usedPct = limit > 0 ? (used / limit * 100) : 0.0;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFe5e7eb),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.storage_rounded, size: 18, color: Color(0xFF1a1a1a)),
                SizedBox(width: 8),
                Text('Storage Management',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 16),

            // Summary card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFf9fafb),
                border: Border.all(color: const Color(0xFFe5e7eb)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      _summaryStat('Terpakai', _formatBytes(used), Alignment.centerLeft),
                      _summaryStat('Tersedia', _formatBytes(available), Alignment.centerRight),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: SizedBox(
                      height: 8,
                      child: LinearProgressIndicator(
                        value: limit > 0 ? (used / limit).clamp(0.0, 1.0) : 0.0,
                        backgroundColor: const Color(0xFFe5e7eb),
                        valueColor: const AlwaysStoppedAnimation(Color(0xFF1a1a1a)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: Text(
                      '${usedPct.toStringAsFixed(2)}% dari ${_formatBytes(limit)} terpakai',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF9ca3af)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Rincian Penyimpanan',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            _buildBody(used, limit),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(int used, int limit) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          children: [
            Text(_error!, style: const TextStyle(color: Color(0xFF9ca3af), fontSize: 13)),
            const SizedBox(height: 8),
            OutlinedButton(onPressed: _load, child: const Text('Coba Lagi')),
          ],
        ),
      );
    }
    final breakdown = _breakdown ?? const {};
    return Column(
      children: [
        for (final c in _categories) ...[
          _categoryRow(c, breakdown[c.key] ?? 0, used, limit),
          const SizedBox(height: 14),
        ],
      ],
    );
  }

  Widget _summaryStat(String label, String value, Alignment align) {
    return Column(
      crossAxisAlignment:
          align == Alignment.centerLeft ? CrossAxisAlignment.start : CrossAxisAlignment.end,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF9ca3af))),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _categoryRow(_Category c, int size, int used, int limit) {
    final pctOfLimit = limit > 0 ? (size / limit * 100) : 0.0;
    final pctOfUsed = used > 0 ? (size / used).clamp(0.0, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: c.color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(c.icon, size: 16, color: c.color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(c.label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text('${pctOfLimit.toStringAsFixed(1)}% dari total storage',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF9ca3af))),
                ],
              ),
            ),
            Text(_formatBytes(size),
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: SizedBox(
            height: 6,
            child: LinearProgressIndicator(
              value: pctOfUsed,
              backgroundColor: const Color(0xFFe5e7eb),
              valueColor: AlwaysStoppedAnimation(c.color),
            ),
          ),
        ),
      ],
    );
  }
}

Future<void> showStorageBreakdownSheet(BuildContext context, User user) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => StorageBreakdownSheet(user: user),
  );
}
