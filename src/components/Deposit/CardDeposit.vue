<template>
  <div class="deposit-account">
    <div id="card-fields-container">
      <div class="deposit-card m-input-wap-wrapper m-input-wap-group m-input-wap-group--prepend">
        <div class="m-input-wap-prepend m-input-wap-prepend--default">
          <i class="icon icon-card"></i>
        </div>
        <i class="m-input-wap-icon m-input-wap-icon--clickable m-icon-delete"></i>
        <div class="m-input-transform">
          <input type="tel" name="" placeholder="Card Number" class="m-input-wap fs-exclude" />
        </div>
      </div>
      <div class="error-msg"></div>
      <div class="expiryAndCvv">
        <div class="expiry-container">
          <div
            class="deposit-expiry m-input-wap-wrapper m-input-wap-group m-input-wap-group--prepend"
          >
            <div class="m-input-wap-prepend m-input-wap-prepend--default">
              <i class="icon icon-date"></i>
            </div>
            <i class="m-input-wap-icon m-input-wap-icon--clickable m-icon-delete"></i>
            <div class="m-input-transform">
              <input type="tel" name="" placeholder="Expiry" class="m-input-wap fs-exclude" />
            </div>
          </div>
          <div class="error-msg"></div>
        </div>
        <div class="cvv-container">
          <div class="deposit-cvv m-input-wap-wrapper m-input-wap-group m-input-wap-group--prepend">
            <div class="m-input-wap-prepend m-input-wap-prepend--default">
              <i class="icon icon-lock"></i>
            </div>
            <i class="m-input-wap-icon m-input-wap-icon--clickable m-icon-delete"></i>
            <div class="m-input-transform">
              <input
                type="tel"
                name=""
                placeholder="CVV"
                maxlength="3"
                class="m-input-wap fs-exclude"
              />
            </div>
          </div>
          <div class="error-msg"></div>
        </div>
      </div>
    </div>
  </div>
  <div class="deposit-footer" style="">
    <div class="balance-container">
      <div class="balance-section">
        <span class="balance-text"
          ><span data-cms-key="balance">Balance</span>
          (NGN) 883.65
        </span>
      </div>
    </div>
    <div class="input-container">
      <div class="deposit-amount m-input-wap-wrapper m-input-wap-group m-input-wap-group--prepend">
        <div class="m-input-wap-prepend m-input-wap-prepend--default">
          <span class="amount-prepend"
            ><span data-cms-key="amount">Amount</span>
            (NGN)
          </span>
        </div>
        <i class="m-input-wap-icon m-input-wap-icon--clickable m-icon-delete"></i>
        <input type="tel" name="" placeholder="min. 100" class="m-input-wap" />
      </div>
    </div>

    <span class="error-msg"> </span>
    <button class="af-button deposit-submit af-button--primary is-disabled">
      <span><span> Top Up Now </span></span>
    </button>

    <div class="example-cards-container" style="">
      <img src="https://s.sporty.net/cms/master_549a1ed7e0.png" alt="" class="example-card" /><img
        src="https://s.sporty.net/cms/verve_3421127dd4.png"
        alt=""
        class="example-card"
      /><img src="https://s.sporty.net/cms/visa_6e9cd942ee.png" alt="" class="example-card" />
    </div>
  </div>
  <div class="deposit-footer" style="">
    <div data-v-7ceae3b5="" class="wrap">
      <ul data-v-7ceae3b5="" class="m-dp-tips f-count">
        <li data-v-7ceae3b5="" class="l-item">
          1. Minimum deposit amount is NGN 100.00 - you can deposit at least NGN 100.00 in one
          transaction.
        </li>
        <li data-v-7ceae3b5="" class="l-item">
          2. Maximum per transaction is NGN 9,999,999.00 - you can deposit up to NGN 9,999,999.00 in
          one transaction.
        </li>
        <li data-v-7ceae3b5="" class="l-item">
          3. Any card details you choose to save are encrypted. We do not store your CVV. We will
          also ask you to input your Sporty PIN any time you want to use your card after it has been
          successfully used for the first time and saved.
        </li>
        <li data-v-7ceae3b5="" class="l-item">
          4. We do not share your payment information. It is used for transaction verification only.
        </li>
        <li data-v-7ceae3b5="" class="l-item">
          5. If you have any issues, please contact customer service. Using too many cards or bank
          accounts for deposits may cause the deposit to be blocked and your account restricted.
        </li>
        <li data-v-7ceae3b5="" class="l-item">
          6. Deposit is free, there are no transaction fees.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup></script>

<style>
#deposit .deposit-account {
  padding: 0 1.33333333rem;
}

#deposit .deposit-account .deposit-card {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  margin-top: 1.83333333rem;
}

#deposit .deposit-account .add-new-card-btn {
  color: #0d9737;
  color: var(--brand-quaternary);
  font-size: 1.066rem;
  padding: 2.66666667rem 0;
  text-align: center;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

#deposit .deposit-account .static {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  border: 1px solid #eaecef;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  width: 100%;
  border-color: #eaecef;
  border-color: var(--brand-border-type1);
}

#deposit .deposit-account .static.error {
  border-color: #e41827;
  border-color: var(--warning-primary);
}

#deposit .deposit-account .static .static-prepend {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  margin: 0 10px;
}

#deposit .deposit-account .static .static-content {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  padding: 8px 0;
}

#deposit .deposit-account .static .static-content .static-card-label {
  color: #0d9737;
  color: var(--brand-text-secondary);
  font-size: 10px;
  height: 12px;
  line-height: 12px;
  margin-bottom: 4px;
  text-align: left;
}

#deposit .deposit-account .static .static-content .static-card-number {
  font-size: 14px;
  height: 16px;
  line-height: 16px;
}

#deposit .deposit-account .static .static-card-name {
  -webkit-box-flex: 0;
  -webkit-flex: 0;
  -ms-flex: 0;
  flex: 0;
}

#deposit .deposit-account .static .static-card-icon {
  -webkit-box-flex: 0;
  -webkit-flex: 0;
  -ms-flex: 0;
  flex: 0;
  height: 20px;
  margin-left: 0.66666667rem;
}

#deposit .deposit-account .static .static-clear {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  margin: 0 0.75rem;
}

#deposit .deposit-account .static .static-clear::before {
  content: '\e602';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

#deposit .deposit-account .switch-container {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 14px;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  margin-bottom: 1.066rem;
  margin-top: 0.75rem;
}

#deposit .deposit-account .switch-container .switch-card {
  color: #0d9737;
  color: var(--brand-text-secondary);
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  font-size: 14px;
  line-height: 14px;
}

#deposit .deposit-account .switch-container .switch-card .switch-icon {
  margin-left: 0.66666667rem;
}

#deposit .deposit-account .switch-container .switch-card .switch-icon::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

#deposit .deposit-account .switch-container .switch-card .switch-icon:before {
  font-size: 14px;
}

#deposit .deposit-account .m-loading-wrap {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 1;
}
</style>
