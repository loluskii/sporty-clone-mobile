import { computed } from 'vue'
import { useAuthStore, useUtilsStore } from '../stores'

export const useGlobalUtils = () => {
  const utilsStore = useUtilsStore()
  const authStore = useAuthStore()

  return computed(() => {
    const { CurrencyCode, DialCode, brandName } = utilsStore.SportsbookGlobalVariable
    const isAuthenticated = authStore.token !== null

    return {
      isAuthenticated,
      currency: CurrencyCode,
      dialCode: DialCode,
      brandName,
      formatCurrency: (amount) => `${CurrencyCode} ${amount.toLocaleString()}`,
      formatPhoneNumber: (number) => `${DialCode}${number}`
    }
  })
}
