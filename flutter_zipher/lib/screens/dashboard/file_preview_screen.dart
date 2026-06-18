import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:open_file/open_file.dart';
import 'package:pdfx/pdfx.dart';
import '../../models/file_item.dart';

enum _PreviewKind { image, pdf, text, unsupported }

class FilePreviewScreen extends StatefulWidget {
  final FileItem item;
  final String localPath;

  const FilePreviewScreen({
    super.key,
    required this.item,
    required this.localPath,
  });

  @override
  State<FilePreviewScreen> createState() => _FilePreviewScreenState();
}

class _FilePreviewScreenState extends State<FilePreviewScreen> {
  PdfControllerPinch? _pdfController;
  Future<String>? _textFuture;
  late final _PreviewKind _kind;

  static const _imageExts = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'};
  static const _textExts = {
    'txt', 'md', 'markdown', 'json', 'csv', 'log', 'xml', 'yaml', 'yml',
    'html', 'htm', 'css', 'js', 'ts', 'dart', 'py', 'java', 'c', 'cpp',
    'h', 'sh', 'sql', 'ini', 'env', 'kt', 'go', 'rb', 'php', 'rs',
  };

  @override
  void initState() {
    super.initState();
    _kind = _detectKind();

    if (_kind == _PreviewKind.pdf) {
      _pdfController = PdfControllerPinch(
        document: PdfDocument.openFile(widget.localPath),
      );
    } else if (_kind == _PreviewKind.text) {
      _textFuture = _loadText();
    }
  }

  @override
  void dispose() {
    _pdfController?.dispose();
    super.dispose();
  }

  _PreviewKind _detectKind() {
    final ext = widget.item.name.split('.').last.toLowerCase();
    final mime = widget.item.mimeType?.toLowerCase() ?? '';

    if (mime.startsWith('image/') || _imageExts.contains(ext)) {
      return _PreviewKind.image;
    }
    if (mime == 'application/pdf' || ext == 'pdf') {
      return _PreviewKind.pdf;
    }
    if (mime.startsWith('text/') ||
        mime == 'application/json' ||
        _textExts.contains(ext)) {
      return _PreviewKind.text;
    }
    return _PreviewKind.unsupported;
  }

  Future<String> _loadText() async {
    final bytes = await File(widget.localPath).readAsBytes();
    // Tolerate non-strict UTF-8 so logs/CSVs with odd bytes still render.
    return utf8.decode(bytes, allowMalformed: true);
  }

  Future<void> _saveToDevice(BuildContext context) async {
    final String? outputFile = await FilePicker.platform.saveFile(
      dialogTitle: 'Simpan file',
      fileName: widget.item.name,
    );
    if (outputFile == null) return;

    try {
      await File(widget.localPath).copy(outputFile);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('File berhasil disimpan ke: $outputFile'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menyimpan file: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dark = _kind == _PreviewKind.image || _kind == _PreviewKind.pdf;

    return Scaffold(
      backgroundColor: dark ? Colors.black : const Color(0xFFf3f4f6),
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Icon(widget.item.icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.item.name,
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
            onPressed: () => OpenFile.open(widget.localPath),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    switch (_kind) {
      case _PreviewKind.image:
        return Center(
          child: InteractiveViewer(
            minScale: 0.5,
            maxScale: 4.0,
            child: Image.file(File(widget.localPath), fit: BoxFit.contain),
          ),
        );
      case _PreviewKind.pdf:
        return PdfViewPinch(controller: _pdfController!);
      case _PreviewKind.text:
        return FutureBuilder<String>(
          future: _textFuture,
          builder: (_, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snap.hasError) return _unsupported('Gagal membaca file teks.');
            return Container(
              color: Colors.white,
              width: double.infinity,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: SelectableText(
                  snap.data ?? '',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 13,
                    height: 1.5,
                    color: Color(0xFF1a1a1a),
                  ),
                ),
              ),
            );
          },
        );
      case _PreviewKind.unsupported:
        return _unsupported('Preview tidak tersedia untuk file ini.');
    }
  }

  Widget _unsupported(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(widget.item.icon, size: 80, color: Colors.black26),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            icon: const Icon(Icons.open_in_new_rounded),
            label: const Text('Buka dengan aplikasi eksternal'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1a1a1a),
              foregroundColor: Colors.white,
            ),
            onPressed: () => OpenFile.open(widget.localPath),
          ),
        ],
      ),
    );
  }
}
