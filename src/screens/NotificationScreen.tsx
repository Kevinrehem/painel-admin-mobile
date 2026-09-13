import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  DeviceEventEmitter,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, BellOff, X, ChevronRight, Info } from 'lucide-react-native';
import {
  DynamicField,
  StoredNotification,
  getStoredNotifications,
  markNotificationAsRead,
  NOTIFICATION_RECEIVED_EVENT,
} from '../services/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationCardProps {
  notification: StoredNotification;
  onPress: (notification: StoredNotification) => void;
  isDark: boolean;
}

// ─── DynamicField Renderer ────────────────────────────────────────────────────

const DynamicFieldRow: React.FC<{ field: DynamicField; isDark: boolean }> = ({ field, isDark }) => (
  <View style={[styles.fieldRow, isDark && styles.fieldRowDark]}>
    <Text style={[styles.fieldLabel, isDark && styles.fieldLabelDark]}>{field.label}</Text>
    <Text style={[styles.fieldValue, isDark && styles.fieldValueDark]}>{field.value}</Text>
  </View>
);

// ─── Notification Card ────────────────────────────────────────────────────────

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onPress, isDark }) => {
  const formattedDate = new Date(notification.receivedAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(notification)}
      style={[
        styles.card,
        isDark && styles.cardDark,
        !notification.read && styles.cardUnread,
        !notification.read && isDark && styles.cardUnreadDark,
      ]}
    >
      <View style={styles.cardLeft}>
        {!notification.read && <View style={styles.unreadIndicator} />}
        <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
          <Bell size={20} color={isDark ? '#90CDF4' : '#3182CE'} />
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isDark && styles.cardTitleDark, !notification.read && styles.cardTitleUnread]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={[styles.cardDate, isDark && styles.cardDateDark]}>{formattedDate}</Text>
        </View>
        <Text style={[styles.cardMessage, isDark && styles.cardMessageDark]} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
      
      <View style={styles.cardAction}>
        <ChevronRight size={18} color={isDark ? '#4A5568' : '#CBD5E0'} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <View style={styles.emptyContainer}>
    <View style={[styles.emptyIconContainer, isDark && styles.emptyIconContainerDark]}>
      <BellOff size={32} color={isDark ? '#718096' : '#A0AEC0'} />
    </View>
    <Text style={[styles.emptyTitle, isDark && emptyStyles.emptyTitleDark]}>
      Nenhuma notificação
    </Text>
    <Text style={[styles.emptySubtitle, isDark && emptyStyles.emptySubtitleDark]}>
      Você está em dia! Notificações recebidas aparecerão aqui.
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const NotificationScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<StoredNotification | null>(null);
  
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const stored = await getStoredNotifications();
    setNotifications(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();

    // Listen for real-time notification events
    const subscription = DeviceEventEmitter.addListener(NOTIFICATION_RECEIVED_EVENT, () => {
      loadNotifications();
    });

    return () => {
      subscription.remove();
    };
  }, [loadNotifications]);

  const handlePressCard = useCallback(async (notification: StoredNotification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top', 'left', 'right']}>
      {/* Screen Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Notificações</Text>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3182CE" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={handlePressCard}
              isDark={isDark}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={<EmptyState isDark={isDark} />}
          onRefresh={loadNotifications}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Notification Detail Modal */}
      <Modal
        visible={!!selectedNotification}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <View style={[styles.modalHeader, isDark && styles.modalHeaderDark, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16 }]}>
            <Text style={[styles.modalHeaderTitle, isDark && styles.modalHeaderTitleDark]}>
              Detalhes
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, isDark && styles.closeButtonDark]}
              onPress={() => setSelectedNotification(null)}
            >
              <X size={24} color={isDark ? '#E2E8F0' : '#4A5568'} />
            </TouchableOpacity>
          </View>

          {selectedNotification && (
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalTopSection}>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, isDark && styles.badgeDark]}>
                    <Text style={[styles.badgeText, isDark && styles.badgeTextDark]}>
                      {selectedNotification.type}
                    </Text>
                  </View>
                  <Text style={[styles.modalDate, isDark && styles.modalDateDark]}>
                    {new Date(selectedNotification.receivedAt).toLocaleString('pt-BR')}
                  </Text>
                </View>

                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  {selectedNotification.title}
                </Text>
                
                <Text style={[styles.modalMessage, isDark && styles.modalMessageDark]}>
                  {selectedNotification.message}
                </Text>
              </View>

              {selectedNotification.dynamicFields && selectedNotification.dynamicFields.length > 0 && (
                <View style={[styles.modalExtraSection, isDark && styles.modalExtraSectionDark]}>
                  <View style={styles.extraSectionHeader}>
                    <Info size={18} color={isDark ? '#90CDF4' : '#3182CE'} />
                    <Text style={[styles.extraSectionTitle, isDark && styles.extraSectionTitleDark]}>
                      Informações Adicionais
                    </Text>
                  </View>
                  <View style={[styles.dynamicFieldsContainer, isDark && styles.dynamicFieldsContainerDark]}>
                    {selectedNotification.dynamicFields.map((field, index) => (
                      <DynamicFieldRow key={index} field={field} isDark={isDark} />
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const BG_LIGHT = '#F7FAFC';
const BG_DARK = '#121212'; // Softer dark mode background

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  containerDark: {
    backgroundColor: BG_DARK,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.5,
  },
  headerTitleDark: {
    color: '#F7FAFC',
  },
  headerBadge: {
    marginLeft: 12,
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Card UI Revamp
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2D3748',
  },
  cardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BEE3F8',
  },
  cardUnreadDark: {
    backgroundColor: '#1A202C',
    borderColor: '#2B6CB0',
  },
  cardLeft: {
    marginRight: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53E3E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerDark: {
    backgroundColor: '#2A4365',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    marginRight: 8,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: '#1A202C',
  },
  cardTitleDark: {
    color: '#E2E8F0',
  },
  cardDate: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  cardDateDark: {
    color: '#718096',
  },
  cardMessage: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  cardMessageDark: {
    color: '#A0AEC0',
  },
  cardAction: {
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Modal UI
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContainerDark: {
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    backgroundColor: '#FFFFFF',
  },
  modalHeaderDark: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#2D3748',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
  },
  modalHeaderTitleDark: {
    color: '#F7FAFC',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 20,
  },
  closeButtonDark: {
    backgroundColor: '#2D3748',
  },
  modalScrollContent: {
    padding: 20,
  },
  modalTopSection: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeDark: {
    backgroundColor: '#2A4365',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B6CB0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeTextDark: {
    color: '#90CDF4',
  },
  modalDate: {
    fontSize: 13,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  modalDateDark: {
    color: '#718096',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 12,
    lineHeight: 28,
  },
  modalTitleDark: {
    color: '#F7FAFC',
  },
  modalMessage: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
  },
  modalMessageDark: {
    color: '#CBD5E0',
  },
  modalExtraSection: {
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  modalExtraSectionDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2D3748',
  },
  extraSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  extraSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginLeft: 8,
  },
  extraSectionTitleDark: {
    color: '#E2E8F0',
  },
  dynamicFieldsContainer: {
    gap: 12,
  },
  dynamicFieldsContainerDark: {
    
  },
  fieldRow: {
    flexDirection: 'column',
    gap: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fieldRowDark: {
    borderBottomColor: '#4A5568',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabelDark: {
    color: '#A0AEC0',
  },
  fieldValue: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
  },
  fieldValueDark: {
    color: '#F7FAFC',
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconContainerDark: {
    backgroundColor: '#2D3748',
  },
});

const emptyStyles = StyleSheet.create({
  emptyTitleDark: {
    color: '#E2E8F0',
  },
  emptySubtitleDark: {
    color: '#A0AEC0',
  },
});
