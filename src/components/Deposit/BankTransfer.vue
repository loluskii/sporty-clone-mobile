<template>
  <div class="deposit-footer deposit-footer--bank-transfer" style="">
    <div class="balance-container">
      <div class="balance-section balance-section--bank-transfer">
        <span class="balance-text balance-text--bank-transfer"
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
    <button
      class="af-button deposit-submit af-button--primary is-disabled"
      data-op="deposit-submit-button"
    >
      <span><span> Top Up Now </span></span>
    </button>
  </div>
</template>
<style>
.bank-transfer-card {
  margin-bottom: 1.66666667rem;
  padding: 1rem 1.33333333rem 1.33333333rem;
  border-radius: 0.16666667rem;
}
.bank-transfer-card-title {
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.33333333rem;
}
.bank-transfer-card-steps {
  counter-reset: step-counter;
  list-style: none;
}
.bank-transfer-card-steps li {
  margin-bottom: 1rem;
  display: flex;
  counter-increment: step-counter;
}
.bank-transfer-card-steps li:before {
  content: 'Step ' counter(step-counter);
  margin-right: 1rem;
  color: #9ca0ab;
  display: block;
  min-width: 2.91666667rem;
}
.bank-transfer-card-steps li:last-child {
  margin-bottom: 0;
}

ol.bank-transfer-card-steps {
  padding: 0;
}
html[theme='dark'] {
  color: #fff;
  background-color: #1b1e25;
}

html,
html[theme='light'] {
  color: #000;
  background-color: #fafafa;
}
</style>
