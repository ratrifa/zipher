import 'package:flutter/material.dart';

class AppTheme {
  static const _primary = Color(0xFF1a1a1a);
  static const _violet = Color(0xFF6366f1);
  static const _surface = Color(0xFFfafafa);
  static const _error = Color(0xFFdc2626);
  static const _border = Color(0xFFe5e7eb);

  static const gradientBlueViolet = LinearGradient(
    colors: [Color(0xFF3b82f6), Color(0xFF7c3aed)],
  );

  static const cardRadius = BorderRadius.all(Radius.circular(16));
  static const pillRadius = BorderRadius.all(Radius.circular(24));

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          primary: _primary,
          secondary: _violet,
          surface: _surface,
          error: _error,
          outline: _border,
          onPrimary: Colors.white,
          onSurface: _primary,
          surfaceContainerHighest: Color(0xFFf3f4f6),
        ),
        scaffoldBackgroundColor: Colors.white,
        cardTheme: const CardThemeData(
          color: _surface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: cardRadius,
            side: BorderSide(color: _border),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFf9fafb),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: _border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: _border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: _primary, width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: _error),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: _primary,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: _primary,
            minimumSize: const Size.fromHeight(48),
            side: const BorderSide(color: _border),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(foregroundColor: _primary),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: _primary,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: _primary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: Colors.white,
          indicatorColor: const Color(0xFFf3f4f6),
          surfaceTintColor: Colors.transparent,
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _primary);
            }
            return const TextStyle(fontSize: 12, color: Color(0xFF6b7280));
          }),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const IconThemeData(color: _primary, size: 22);
            }
            return const IconThemeData(color: Color(0xFF6b7280), size: 22);
          }),
        ),
        dividerTheme: const DividerThemeData(color: _border, space: 1),
        chipTheme: ChipThemeData(
          backgroundColor: const Color(0xFFf3f4f6),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          labelStyle: const TextStyle(fontSize: 11, color: _primary),
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          backgroundColor: _primary,
          contentTextStyle: const TextStyle(color: Colors.white, fontSize: 14),
        ),
      );
}
