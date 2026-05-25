class User {
  final int id;
  final String username;
  final String email;
  final String? avatar;
  final String publicKey;
  final bool isAdmin;
  final int storageUsed;
  final int storageLimit;

  const User({
    required this.id,
    required this.username,
    required this.email,
    this.avatar,
    required this.publicKey,
    this.isAdmin = false,
    this.storageUsed = 0,
    this.storageLimit = 1073741824, // 1 GB default
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: _toInt(json['id']),
        username: json['username']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        avatar: json['avatar'] as String?,
        publicKey: json['public_key']?.toString() ?? '',
        isAdmin: json['is_admin'] == true || json['is_admin'] == 1,
        storageUsed: _toInt(json['storage_used'], fallback: 0),
        storageLimit: _toInt(json['storage_limit'], fallback: 1073741824),
      );

  static int _toInt(dynamic value, {int fallback = 0}) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? fallback;
  }

  double get storagePercent =>
      storageLimit > 0 ? (storageUsed / storageLimit).clamp(0.0, 1.0) : 0.0;

  String get initials {
    final parts = username.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return username.isNotEmpty ? username[0].toUpperCase() : '?';
  }
}
