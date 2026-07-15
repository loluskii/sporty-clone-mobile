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
        >
          <div class="notification-card-head">
            <div>
              <div class="notification-card-title">
                {{ notification.title || notification.subject || 'Notification' }}
              </div>
              <div class="notification-card-meta">
                {{ formatNotificationDate(notification) }}
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
            {{ notification.message || notification.body || notification.content || notification.text }}
          </p>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import HeaderOther from '@/components/HeaderOther.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import { fetchUserNotifications, formatDate } from '@/helpers'

const isLoading = ref(false)
const rawNotifications = ref([])

const notifications = computed(() => rawNotifications.value || [])

const isUnread = (notification) => {
  return notification?.read === false || notification?.isRead === false || notification?.status === 'unread'
}

const formatNotificationDate = (notification) => {
  const createdAt = notification?.createdAt || notification?.created_at || notification?.date
  if (!createdAt) return ''
  return formatDate(createdAt, 'DD MMM, YYYY hh:mma')
}

async function loadNotifications() {
  isLoading.value = true
  try {
    const response = await fetchUserNotifications()
    const payload = response?.data ?? response
    const items =
      payload?.notifications ||
      payload?.data?.notifications ||
      payload?.items ||
      payload?.data ||
      []

    rawNotifications.value = Array.isArray(items) ? items : []
  } catch (error) {
    console.warn('Failed to load notifications:', error)
    rawNotifications.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-view {
  min-height: 100%;
  background: #f5f7fa;
}

.notifications-shell {
  padding: 1rem;
}

.notifications-list {
  display: grid;
  gap: 0.75rem;
}

.notification-card {
  background: #ffffff;
  border: 1px solid #e6e9ef;
  border-radius: 1rem;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.04);
  padding: 1rem;
}

.notification-card-head {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
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
  line-height: 1.5;
  margin: 0.75rem 0 0;
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
