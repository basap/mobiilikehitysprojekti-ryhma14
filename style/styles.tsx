import { StyleSheet, Platform } from 'react-native';

// Colors
export const Colors = {
  primary:      '#4CAF50',
  primaryDark:  '#388E3C',
  primaryLight: '#E8F5E9',
  white:        '#FFFFFF',
  bg:           '#FAFAFA',
  border:       '#D6D6D6',
  borderLight:  '#E8E8E8',
  text:         '#212121',
  textMuted:    '#757575',
  error:        '#D32F2F',
  overlay:      'rgba(0,0,0,0.35)',
};

// Spacing and radius
export const Spacing = { xs: 4, sm: 16, md: 16, lg: 24, xl: 32 };
export const Radius = { sm: 6, md: 8, pill: 999 };

// Shadows
export const Shadow = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
  android: { elevation: 4 },
});

// Typography
export const Typography = StyleSheet.create({
  screenTitle:    { fontSize: 40, fontStyle: 'italic', fontWeight: '700', color: Colors.primary },
  pageHeading:    { fontSize: 26, fontWeight: '700', color: Colors.text },
  sectionHeading: { fontSize: 20, fontWeight: '600', color: Colors.text },
  body:           { fontSize: 16, color: Colors.text, lineHeight: 22 },
  subtitle:       { fontSize: 17, color: Colors.textMuted, lineHeight: 20 },
  caption:        { fontSize: 12, color: Colors.textMuted },
  link:           { fontSize: 14, fontWeight: '600', color: Colors.primary, textDecorationLine: 'none' },
  inputLabel:     { fontSize: 12, fontWeight: '500', color: Colors.primary, marginBottom: Spacing.xs },
});

// Buttons
export const Btn = StyleSheet.create({
  primary:      { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, alignItems: 'center', minWidth: 250 },
  primaryText:  { color: '#FFF', fontSize: 16, fontWeight: '600' },
  outline:      { backgroundColor: 'transparent', paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', minWidth: 200 },
  outlineText:  { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  pill:         { backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: Spacing.md, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center' },
  pillText:     { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  textBtn:      { padding: Spacing.sm },
  textBtnLabel: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});

// Input fields
export const Input = StyleSheet.create({
  field:   { backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: Platform.select({ ios: 14, android: 10 }), paddingHorizontal: Spacing.md, fontSize: 16, color: Colors.text },
  focused: { borderColor: Colors.primary, borderWidth: 1.5 },
  error:   { borderColor: Colors.error },
  helper:  { fontSize: 12, color: Colors.textMuted, marginTop: Spacing.xs },
  errText: { fontSize: 12, color: Colors.error, marginTop: Spacing.xs },
});

// General layout
export const Layout = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: Colors.bg },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg, marginBottom: 50 },
  content:    { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  row:        { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

// Card styles
export const Card = StyleSheet.create({
  base:    { backgroundColor: '#FFF', borderRadius: Radius.md, padding: Spacing.md, ...Shadow },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
});

// Progress bar
export const Progress = StyleSheet.create({
  track: { height: 8, backgroundColor: Colors.borderLight, borderRadius: Radius.pill, overflow: 'hidden' },
  fill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.pill },
});

// Modals
export const ModalStyle = StyleSheet.create({
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center' },
  container: { backgroundColor: '#FFF', borderRadius: Radius.md, padding: Spacing.lg, width: '85%', maxWidth: 340, ...Shadow },
});