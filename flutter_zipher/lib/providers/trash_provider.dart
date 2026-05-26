import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../models/file_item.dart';

final trashProvider = FutureProvider.autoDispose<List<FileItem>>((ref) async {
  final results = await Future.wait([
    dio.get(Endpoints.filesTrash),
    dio.get(Endpoints.foldersTrash),
  ]);

  final files = (results[0].data['data'] as List<dynamic>? ?? [])
      .map((e) => FileItem.fromJson(e as Map<String, dynamic>))
      .toList();
  final folders = (results[1].data['data'] as List<dynamic>? ?? [])
      .map((e) => FileItem.fromJson(e as Map<String, dynamic>, isFolder: true))
      .toList();

  return [...folders, ...files];
});
