<template>
  <div class="notifications-view">
    <HeaderOther header-title="Messages"></HeaderOther>

    <div class="notifications-shell">
      <LoadingSpinner v-if="isLoading" />

      <div v-else-if="!notifications.length" class="notifications-empty">
        <h3>No messages yet</h3>
        <p>You’ll see account and system updates here when they arrive.</p>
      </div>

      <div v-else class="notifications-list">
        <article
          v-for="notification in notifications"
          :key="notification.id || notification.notificationId || notification.createdAt || notification.title"
          class="notification-card"
          :class="{ 'notification-card--unread': isUnread(notification) }"
        >
          <div class="notification-card-head">
            <div class="notification-card-copy">
              <div class="notification-card-title">
                {{ notification.title }}
              </div>
              <div class="notification-card-meta">
                {{ new Date(notification.createdAt).toLocaleDateString() }}
              </div>
            </div>
            <span
              v-if="isUnread(notification)"
              class="notification-card-pill notification-card-pill--unread"
            >
              New
            </span>
          </div>

          <p class="notification-card-body">
            {{ notification.description }}
          </p>

          <div class="notification-card-actions">
            <button
              type="button"
              class="notification-card-action notification-card-action--ghost"
              :disabled="busyId === getNotificationId(notification)"
              @click="toggleRead(notification)"
            >
              {{
                isUnread(notification)
                  ? busyId === getNotificationId(notification) && busyAction === 'read'
                    ? 'Marking...'
                    : 'Mark read'
                  : 'Read'
              }}
            </button>
            <button
              type="button"
              class="notification-card-action notification-card-action--danger"
              :disabled="busyId === getNotificationId(notification)"
              @click="deleteItem(notification)"
            >
              {{ busyId === getNotificationId(notification) && busyAction === 'delete' ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import HeaderOther from '@/components/HeaderOther.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import {
  deleteUserNotification,
  fetchUserNotifications,
  formatDate,
  invalidateCachedRequest,
  markUserNotificationRead
} from '@/helpers'

const isLoading = ref(false)
const rawNotifications = ref([])
const busyId = ref('')
const busyAction = ref('')

const notifications = computed(() => rawNotifications.value || [])

const getNotificationId = (notification) => {
  return notification?.id || notification?.notificationId || notification?.notification_id || ''
}

const isUnread = (notification) => {
  return (
    notification?.read === false ||
    notification?.isRead === false ||
    notification?.status === 0 ||
    notification?.status === 'unread'
  )
}

async function loadNotifications() {
  isLoading.value = true
  try {
    const response = await fetchUserNotifications()
    const payload = response?.data ?? response

    rawNotifications.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    console.warn('Failed to load notifications:', error)
    rawNotifications.value = []
  } finally {
    isLoading.value = false
  }
}

async function refreshNotifications() {
  invalidateCachedRequest('user-notifications', 'auth')
  await loadNotifications()
}

async function toggleRead(notification) {
  const id = getNotificationId(notification)
  if (!id || busyId.value) return

  if (!isUnread(notification)) return

  busyId.value = id
  busyAction.value = 'read'
  try {
    await markUserNotificationRead(id)
    await refreshNotifications()
  } catch (error) {
    console.warn('Failed to mark notification as read:', error)
  } finally {
    busyId.value = ''
    busyAction.value = ''
  }
}

async function deleteItem(notification) {
  const id = getNotificationId(notification)
  if (!id || busyId.value) return

  busyId.value = id
  busyAction.value = 'delete'
  try {
    await deleteUserNotification(id)
    await refreshNotifications()
  } catch (error) {
    console.warn('Failed to delete notification:', error)
  } finally {
    busyId.value = ''
    busyAction.value = ''
  }
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-view {
  min-height: 80vh;
  background: #f5f7fa;
}

.notifications-shell {
  padding: 1rem;
}

.notifications-list {
  display: grid;
  gap: 0.85rem;
}

.notification-card {
  background: #ffffff;
  border: 1px solid #e6e9ef;
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.04);
  padding: 1rem;
}

.notification-card--unread {
  border-color: rgba(13, 151, 55, 0.18);
  box-shadow: 0 10px 24px rgba(13, 151, 55, 0.06);
}

.notification-card-head {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.notification-card-copy {
  min-width: 0;
}

.notification-card-title {
  color: #1f2430;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.3;
}

.notification-card-meta {
  color: #8a909d;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}

.notification-card-body {
  color: #4a5160;
  font-size: 0.92rem;
  line-height: 1.55;
  margin: 0.8rem 0 0;
}

.notification-card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.notification-card-action {
  align-items: center;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  flex: 1 1 0;
  font-size: 0.9rem;
  font-weight: 800;
  justify-content: center;
  min-height: 2.6rem;
  padding: 0.5rem 0.8rem;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    opacity 160ms ease;
}

.notification-card-action:disabled {
  cursor: wait;
  opacity: 0.7;
}

.notification-card-action--ghost {
  background: #f4f7fb;
  border-color: #dfe6ef;
  color: #2f3542;
}

.notification-card-action--danger {
  background: rgba(236, 72, 153, 0.1);
  border-color: rgba(236, 72, 153, 0.16);
  color: #d9466f;
}

.notification-card-pill {
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  padding: 0.3rem 0.55rem;
  text-transform: uppercase;
}

.notification-card-pill--unread {
  background: rgba(13, 151, 55, 0.12);
  color: #0d9737;
}

.notifications-empty {
  background: #ffffff;
  border: 1px solid #e6e9ef;
  border-radius: 1rem;
  padding: 1.25rem;
  text-align: center;
}

.notifications-empty h3 {
  color: #1f2430;
  font-size: 1.1rem;
  margin: 0;
}

.notifications-empty p {
  color: #6f7684;
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 0.5rem 0 0;
}
</style>
