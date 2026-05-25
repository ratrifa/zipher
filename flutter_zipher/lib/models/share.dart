import 'file_item.dart';

class ShareItem {
  final int id;
  final FileItem file;
  final String ownerUsername;
  final String? ownerAvatar;
  final String sharedWithUsername;
  final DateTime createdAt;
  final bool isReceived; // true = received, false = sent by me

  const ShareItem({
    required this.id,
    required this.file,
    required this.ownerUsername,
    this.ownerAvatar,
    required this.sharedWithUsername,
    required this.createdAt,
    required this.isReceived,
  });

  factory ShareItem.fromJson(Map<String, dynamic> json, {required bool isReceived}) {
    final fileJson = json['file'] as Map<String, dynamic>;
    return ShareItem(
      id: _toInt(json['id']),
      file: FileItem.fromJson(fileJson),
      ownerUsername: json['owner']?['username']?.toString() ?? '',
      ownerAvatar: json['owner']?['avatar']?.toString(),
      sharedWithUsername: json['shared_with']?['username']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      isReceived: isReceived,
    );
  }

  static int _toInt(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? fallback;
  }
}
