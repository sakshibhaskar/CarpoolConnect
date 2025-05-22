import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Search, Car, MessageSquare, User, Plus, Bell } from 'lucide-react-native';
import { EmergencyButton } from '../../components/ui/EmergencyButton';
import { colors } from '../../constants/theme';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray500,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTitleStyle: {
            color: colors.white,
          },
          headerRight: () => (
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={24} color={colors.white} />
            </TouchableOpacity>
          ),
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Search size={size} color={color} />
            ),
            href: '/',
          }}
        />
        <Tabs.Screen
          name="publish"
          options={{
            title: 'Publish',
            tabBarIcon: ({ color, size }) => (
              <Plus size={size} color={color} />
            ),
            href: '/publish',
          }}
        />
        <Tabs.Screen
          name="rides"
          options={{
            title: 'Your Rides',
            tabBarIcon: ({ color, size }) => (
              <Car size={size} color={color} />
            ),
            href: '/rides',
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Inbox',
            tabBarIcon: ({ color, size }) => (
              <MessageSquare size={size} color={color} />
            ),
            href: '/messages',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} />
            ),
            href: '/profile',
          }}
        />
      </Tabs>
      <EmergencyButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});