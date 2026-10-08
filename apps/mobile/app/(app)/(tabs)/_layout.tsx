import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../../components/app-header';
import { colors } from '../../../lib/theme';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = { dashboard: 'grid-outline', projects: 'folder-open-outline', create: 'add-circle-outline', tasks: 'checkmark-done-outline' };

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      header: () => <AppHeader />,
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} color={color} size={size} />,
      tabBarActiveTintColor: '#8F9AFF', tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { height: 68, paddingTop: 7, paddingBottom: 8, backgroundColor: colors.surface, borderTopColor: colors.border },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' }, sceneStyle: { backgroundColor: colors.canvas },
    })}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="create" options={{ title: 'Create' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
    </Tabs>
  );
}
