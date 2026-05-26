import 'file_item.dart';

class ShareItem {
  final String id;
  final FileItem file;
  final String ownerUsername;
  final String? ownerAvatar;
  final String sharedWithUsername;
  final DateTime createdAt;
  final bool isReceived;

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
      id: json['id']?.toString() ?? '',
      file: FileItem.fromJson(fileJson),
      ownerUsername: json['owner']?['username']?.toString() ?? '',
      ownerAvatar: json['owner']?['avatar']?.toString(),
      // sharedWithMe returns 'owner', sharedByMe returns 'receiver'
      sharedWithUsername: (json['receiver'] ?? json['shared_with'])?['username']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      isReceived: isReceived,
    );
  }
}
