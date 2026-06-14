import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:open_file/open_file.dart';
import '../../models/file_item.dart';

class FilePreviewScreen extends StatelessWidget {
  final FileItem item;
  final String localPath;

  const FilePreviewScreen({
    super.key,
    required this.item,
    required this.localPath,
  });

  bool _isImage(String name) {
    final ext = name.split('.').last.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext);
  }

  Future<void> _saveToDevice(BuildContext context) async {
    final String? outputFile = await FilePicker.platform.saveFile(
      dialogTitle: 'Simpan file',
      fileName: item.name,
    );

    if (outputFile == null) return;

    try {
      final file = File(localPath);
      await file.copy(outputFile);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('File berhasil disimpan ke: $outputFile'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal menyimpan file: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isImage = _isImage(item.name);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Icon(item.icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                item.name,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.download_rounded),
            tooltip: 'Unduh file',
            onPressed: () => _saveToDevice(context),
          ),
          IconButton(
            icon: const Icon(Icons.open_in_new_rounded),
            tooltip: 'Buka dengan aplikasi lain',
            onPressed: () {
              OpenFile.open(localPath);
            },
          ),
        ],
      ),
      body: Center(
        child: isImage
            ? InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Image.file(
                  File(localPath),
                  fit: BoxFit.contain,
                ),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(item.icon, size: 80, color: Colors.white54),
                  const SizedBox(height: 16),
                  Text(
                    'Preview tidak tersedia untuk file ini.',
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.open_in_new_rounded),
                    label: const Text('Buka dengan aplikasi eksternal'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white24,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      OpenFile.open(localPath);
                    },
                  ),
                ],
              ),
      ),
    );
  }
}
