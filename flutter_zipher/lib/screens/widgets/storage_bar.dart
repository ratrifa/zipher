import 'package:flutter/material.dart';
import '../../models/user.dart';

class StorageBar extends StatelessWidget {
  final User user;

  const StorageBar({super.key, required this.user});

  static String _formatBytes(int bytes) {
    if (bytes < 1024) return '${bytes}B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)}GB';
  }

  @override
  Widget build(BuildContext context) {
    final percent = user.storagePercent;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Storage', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text(
                '${_formatBytes(user.storageUsed)} / ${_formatBytes(user.storageLimit)}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF9ca3af)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: SizedBox(
              height: 6,
              child: LinearProgressIndicator(
                value: percent,
                backgroundColor: const Color(0xFFe5e7eb),
                valueColor: const AlwaysStoppedAnimation(Color(0xFF3b82f6)),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${(percent * 100).toStringAsFixed(1)}% terpakai',
            style: const TextStyle(fontSize: 11, color: Color(0xFF9ca3af)),
          ),
        ],
      ),
    );
  }
}
