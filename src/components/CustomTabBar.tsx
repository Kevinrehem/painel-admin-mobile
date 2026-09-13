import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useColorScheme } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Bell } from 'lucide-react-native';

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  
  const backgroundColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const inactiveColor = isDarkMode ? '#718096' : '#A0AEC0';
  const activeColor = isDarkMode ? '#90CDF4' : '#3182CE';
  const activeBgColor = isDarkMode ? '#2A4365' : '#EBF8FF';
  const borderColor = isDarkMode ? '#2D3748' : '#EDF2F7';

  const screenBgColor = isDarkMode ? '#121212' : '#F7FAFC';

  return (
    <View style={{ backgroundColor: screenBgColor, paddingBottom: Math.max(insets.bottom, 16) + 8, paddingTop: 8 }}>
      <View style={[styles.container, { backgroundColor, borderColor }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Render Lucide Icons
          const IconComponent = route.name === 'WebView' ? LayoutDashboard : Bell;
          const iconColor = isFocused ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabIndicator,
                  isFocused ? { backgroundColor: activeBgColor } : styles.transparentBg,
                ]}
              >
                <IconComponent size={22} color={iconColor} strokeWidth={isFocused ? 2.5 : 2} />
                
                {isFocused && (
                  <Text style={[styles.labelText, { color: activeColor }]}>
                    {label as string}
                  </Text>
                )}
              </Animated.View>
              
              {/* Elegant Badge */}
              {options.tabBarBadge && (
                <View style={[styles.badgeContainer, isDarkMode && styles.badgeContainerDark]}>
                  <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 100, // Fully rounded pill shape
    minHeight: 44,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: '25%',
    backgroundColor: '#E53E3E',
    borderRadius: 12, // Perfect circle look with minWidth
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF', // Creates a cutout effect
  },
  badgeContainerDark: {
    borderColor: '#1E1E1E',
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
