import { Stack } from 'expo-router';

export default function PublishLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
    </Stack>
  );
}