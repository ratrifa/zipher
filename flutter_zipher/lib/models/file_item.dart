import 'package:flutter/material.dart';

enum FileType { folder, image, document, spreadsheet, presentation, code, other }

class FileItem {
  final int id;
  final String name;
  final bool isFolder;
  final String? mimeType;
  final int? size;
  final int? itemCount;
  final bool isStarred;
  final DateTime updatedAt;
  final int? folderId;
  final List<String> tags;
  final String? ownerUsername;

  const FileItem({
    required this.id,
    required this.name,
    required this.isFolder,
    this.mimeType,
    this.size,
    this.itemCount,
    this.isStarred = false,
    required this.updatedAt,
    this.folderId,
    this.tags = const [],
    this.ownerUsername,
  });

  factory FileItem.fromJson(Map<String, dynamic> json, {bool isFolder = false}) => FileItem(
        id: _toInt(json['id']),
        name: json['name']?.toString() ?? '',
        isFolder: isFolder || (json['type'] == 'folder'),
        mimeType: json['mime_type']?.toString(),
        size: _toIntNullable(json['size']),
        itemCount: _toIntNullable(json['item_count']),
        isStarred: json['is_starred'] == true || json['is_starred'] == 1,
        updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? '') ?? DateTime.now(),
        folderId: _toIntNullable(json['folder_id']) ?? _toIntNullable(json['parent_id']),
        tags: (json['tags'] as List<dynamic>?)?.map((t) => t.toString()).toList() ?? [],
        ownerUsername: json['owner']?['username']?.toString(),
      );

  static int _toInt(dynamic v, {int fallback = 0}) {
    if (v == null) return fallback;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? fallback;
  }

  static int? _toIntNullable(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString());
  }

  FileType get fileType {
    if (isFolder) return FileType.folder;
    final mime = mimeType?.toLowerCase() ?? '';
    final ext = name.split('.').last.toLowerCase();
    if (mime.startsWith('image/')) return FileType.image;
    if (mime.contains('spreadsheet') || ['xlsx', 'xls', 'csv', 'ods'].contains(ext)) {
      return FileType.spreadsheet;
    }
    if (mime.contains('presentation') || ['pptx', 'ppt', 'odp'].contains(ext)) {
      return FileType.presentation;
    }
    if (mime.contains('text/') || ['js', 'ts', 'py', 'dart', 'json', 'html', 'css'].contains(ext)) {
      return FileType.code;
    }
    if (mime.contains('pdf') || mime.contains('document') || ['doc', 'docx', 'odt', 'pdf', 'txt'].contains(ext)) {
      return FileType.document;
    }
    return FileType.other;
  }

  IconData get icon {
    switch (fileType) {
      case FileType.folder: return Icons.folder_rounded;
      case FileType.image: return Icons.image_rounded;
      case FileType.document: return Icons.description_rounded;
      case FileType.spreadsheet: return Icons.table_chart_rounded;
      case FileType.presentation: return Icons.slideshow_rounded;
      case FileType.code: return Icons.code_rounded;
      case FileType.other: return Icons.insert_drive_file_rounded;
    }
  }

  Color get iconColor {
    switch (fileType) {
      case FileType.folder: return const Color(0xFFfbbf24);
      case FileType.image: return const Color(0xFF3b82f6);
      case FileType.document: return const Color(0xFFef4444);
      case FileType.spreadsheet: return const Color(0xFF22c55e);
      case FileType.presentation: return const Color(0xFFf97316);
      case FileType.code: return const Color(0xFF8b5cf6);
      case FileType.other: return const Color(0xFF6b7280);
    }
  }

  Color get iconBackground {
    switch (fileType) {
      case FileType.folder: return const Color(0xFFfef3c7);
      case FileType.image: return const Color(0xFFdbeafe);
      case FileType.document: return const Color(0xFFfee2e2);
      case FileType.spreadsheet: return const Color(0xFFdcfce7);
      case FileType.presentation: return const Color(0xFFffedd5);
      case FileType.code: return const Color(0xFFede9fe);
      case FileType.other: return const Color(0xFFf3f4f6);
    }
  }

  String get displayMeta {
    if (isFolder) {
      final count = itemCount ?? 0;
      return '$count item${count == 1 ? '' : 's'}';
    }
    return _formatSize(size ?? 0);
  }

  static String _formatSize(int bytes) {
    if (bytes < 1024) return '${bytes}B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)}GB';
  }
}
