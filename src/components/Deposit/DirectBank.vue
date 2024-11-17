<template>
  <div id="direct-bank-container">
    <div class="accordion">
      <div class="accordion-item">
        <div class="accordion_trigger">
          <div class="accordion_title">
            <img
              src="//s.sporty.net/global/main/brand/sportybet/mobile/images/ubabank.2d5bed1111.png"
            /><span>United Bank for Africa</span>
          </div>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion_wrapper" style="display: none">
          <div class="accordion_content">
            <div class="accordion">
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with USSD</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="uba_deposit_guide_ussd"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Dials <em class="bank-em">*919*26*3#</em>
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> Inputs UBA Magic Banking PIN
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Inputs SportyBet Registered Phone No
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> Inputs Amount
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> Confirms amount to be paid
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">6.</span> An SMS is sent for Confirmation
                        </div>
                      </div>
                    </span>
                    <div class="bank-content-rule">
                      <a href="/ng/m/my_accounts/transactions" class="transaction-link"
                        ><span data-cms-key="check_transaction_result" data-cms-page="page_payment"
                          >Check Transaction Result</span
                        >
                        <span class="arrow-right"></span
                      ></a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with LEO Messenger</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="uba_deposit_guide_leo"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Go to
                          <a href="https://m.me/ubachatbanking" target="_blank" rel="noopener"
                            >https://m.me/ubachatbanking</a
                          >
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> Type <em class="bank-em">'Pay Bills'</em>
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Select
                          <em class="bank-em">'Betting/Lottery'</em>
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> Select
                          <em class="bank-em">'SportyBet'</em>
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> Input SportyBet Registered Phone No
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">6.</span> Enter Amount
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">7.</span> Confirm Payment
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">8.</span> A message is sent for confirmation
                        </div>
                      </div>
                    </span>
                    <div class="bank-content-rule">
                      <a target="_blank" href="https://m.me/ubachatbanking" class="visit-link"
                        ><span
                          data-cms-key="visit_leo_messenger"
                          data-cms-page="common_payment_providers"
                          >Visit LEO Messenger</span
                        ></a
                      >
                      <a href="/ng/m/my_accounts/transactions" class="transaction-link"
                        ><span data-cms-key="check_transaction_result" data-cms-page="page_payment"
                          >Check Transaction Result</span
                        >
                        <span class="arrow-right"></span
                      ></a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with UBA Branches</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="uba_deposit_guide_branch"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          You can visit all UBA branches to fund your SportyBet wallet
                        </div>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with UBA Website</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <div class="bank-content-rule">
                      <h2 data-cms-key="coming_soon" data-cms-page="common_payment_providers">
                        Coming soon.
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with UBA Mobile</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <div class="bank-content-rule">
                      <h2 data-cms-key="coming_soon" data-cms-page="common_payment_providers">
                        Coming soon.
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion_trigger">
          <div class="accordion_title">
            <img
              src="//s.sporty.net/global/main/brand/sportybet/mobile/images/gtbank.199f9ce81c.png"
            /><span>GTBank</span>
          </div>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion_wrapper" style="display: none">
          <div class="accordion_content">
            <div class="accordion">
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with GTBank Website</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="gtbank_deposit_guide_pc"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Login in to your
                          <a
                            class="bank-link"
                            href="https://www.gtbank.com"
                            target="_blank"
                            rel="noopener"
                            >GTBank account</a
                          >.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> From the Internet banking homepage, click
                          <em class="bank-em">'Payments &amp; Collections'</em> from the drop-down
                          menu and then click <em class="bank-em">'Sports and Gaming'</em>. Scroll
                          and select <em class="bank-em">'SPORTYBET'</em> and then click
                          <em class="bank-em">'Make New Payments'</em>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Enter your
                          <em class="bank-em">SportyBet Login Phone Number: 9012749482</em> and the
                          amount you wish to deposit.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> Confirm all your details and bank charges.
                          Answer any security questions and enter your token code or USSD.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> Upon successful payment, your betting
                          wallet will be credited instantly.
                        </div>
                      </div>
                    </span>
                    <div class="bank-content-rule">
                      <a target="_blank" href="https://www.gtbank.com" class="btn"
                        ><span
                          data-cms-key="visit_gtbank_to_deposit"
                          data-cms-page="common_payment_providers"
                          >Visit GTBank to Deposit</span
                        ></a
                      >
                      <a target="_blank" href="/ng/m/my_accounts/transactions" class="btn secondary"
                        ><span data-cms-key="check_transaction_result" data-cms-page="page_payment"
                          >Check Transaction Result</span
                        ></a
                      >
                      <a href="/ng/m/my_accounts/transactions/reconciliation" class="btn__line"
                        ><span
                          data-cms-key="gtbank_deposit_not_arrived"
                          data-cms-page="common_payment_providers"
                          >GTBank deposit not arrived?</span
                        ></a
                      >
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with GTBank Mobile</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="gtbank_deposit_guide_wap"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Open the GTBank mobile banking app and
                          sign in.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> Click on
                          <em class="bank-em">'Other Payments'</em>, then select
                          <em class="bank-em">'More Payments'</em>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Click on
                          <em class="bank-em">'Sports and Gaming'</em> and select
                          <em class="bank-em">'SPORTYBET'.</em>
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> Click on SPORTYBET.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> Enter your
                          <em class="bank-em">SportyBet Login Phone Number: 9012749482</em> and the
                          amount you wish to deposit.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">6.</span> Select the GT Bank account that you wish
                          to make the deposit from, insert your mobile banking pin and confirm.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">7.</span> Upon successful payment, your betting
                          wallet will be credited instantly.
                        </div>
                      </div>
                    </span>
                    <div class="bank-content-rule">
                      <a target="_blank" href="/ng/m/my_accounts/transactions" class="btn secondary"
                        ><span data-cms-key="check_transaction_result" data-cms-page="page_payment"
                          >Check Transaction Result</span
                        ></a
                      >
                      <a href="/ng/m/my_accounts/transactions/reconciliation" class="btn__line"
                        ><span
                          data-cms-key="gtbank_deposit_not_arrived"
                          data-cms-page="common_payment_providers"
                          >GTBank deposit not arrived?</span
                        ></a
                      >
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with USSD</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <div class="bank-content-rule">
                      <div class="bank-content-rule__item">
                        <span data-cms-key="dial" data-cms-page="page_payment">Dial</span>
                        &nbsp; *737*50*Amount*558#
                      </div>
                      <a target="_blank" href="/ng/m/my_accounts/transactions" class="btn secondary"
                        ><span data-cms-key="check_transaction_result" data-cms-page="page_payment"
                          >Check Transaction Result</span
                        ></a
                      >
                      <a href="/ng/m/my_accounts/transactions/reconciliation" class="btn__line"
                        ><span
                          data-cms-key="gtbank_deposit_not_arrived"
                          data-cms-page="common_payment_providers"
                          >GTBank deposit not arrived?</span
                        ></a
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion_trigger">
          <div class="accordion_title">
            <img
              src="//s.sporty.net/global/main/brand/sportybet/mobile/images/zenithbank.97014c8834.png"
            /><span>Zenith Bank</span>
          </div>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion_wrapper" style="display: none">
          <div class="accordion_content">
            <div class="accordion">
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title">
                    <span>Deposit with Zenith Bank Website</span>
                  </div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="zenith_deposit_guide_pc"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Login in to your
                          <a
                            class="bank-link"
                            href="https://ibank.zenithbank.com/InternetBanking/App/Security/Login"
                            target="_blank"
                            rel="noopener"
                            >Zenith Bank Account</a
                          >.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> From the Internet banking homepage, click
                          <em class="bank-em">'Payments'</em> from the drop-down menu and then click
                          <em class="bank-em">'Gaming and Lottery'</em>. Fill the page and click on
                          <em class="bank-em">'Confirm your payment'</em>
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Upon successful payment, your betting
                          wallet will be credited instantly.
                        </div>
                      </div>
                    </span>
                    <div class="bank-content-rule">
                      <a
                        target="_blank"
                        href="https://ibank.zenithbank.com/InternetBanking/App/Security/Login"
                        class="visit-link"
                        ><span
                          data-cms-key="visit_zenith_bank_to_deposit"
                          data-cms-page="common_payment_providers"
                          >Visit Zenith Bank to Deposit</span
                        ></a
                      >
                      <a href="/ng/m/my_accounts/transactions" class="transaction-link"
                        ><span data-cms-key="check_transaction_result" data-cms-page="page_payment"
                          >Check Transaction Result</span
                        >
                        <span class="arrow-right"></span
                      ></a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title">
                    <span>Deposit with Zenith Bank Mobile</span>
                  </div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="zenith_deposit_guide_wap"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Open the Zenith Bank mobile banking app
                          and sign in.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> Click on the dash at the top left and
                          select <em class="bank-em">'Bills, payment and collections'</em>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Select gaming/lottery for the category and
                          select SportyBet for the biller. Put amount to deposit and your SportyBet
                          registered phone number on your reference and click continue.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> A confirmation popup will appear for you
                          to enter your security pin, or token, or both if you have both.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> A successful transaction popup shows if
                          the payment is success.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">6.</span> Upon successful payment, your betting
                          wallet will be credited instantly.
                        </div>
                      </div>
                    </span>
                    <div class="bank-content-rule">
                      <a href="/ng/m/my_accounts/transactions" class="transaction-link"
                        ><span data-cms-key="check_transaction_result" data-cms-page="page_payment"
                          >Check Transaction Result</span
                        >
                        <span class="arrow-right"></span
                      ></a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with USSD</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="zenith_deposit_guide_ussd"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Dial *966*6*7767#.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> Enter your 10 or 11 digits registered
                          mobile number.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Enter the amount you wish to deposit.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> Enter your pin.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> A notification will be received upon
                          deposit success.
                        </div>
                      </div>
                    </span>
                    <div class="bank-content-rule">
                      <a href="/ng/m/my_accounts/transactions" class="transaction-link"
                        ><span data-cms-key="check_transaction_result" data-cms-page="page_payment"
                          >Check Transaction Result</span
                        >
                        <span class="arrow-right"></span
                      ></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion_trigger">
          <div class="accordion_title">
            <img
              src="//s.sporty.net/global/main/brand/sportybet/mobile/images/kuda.90e4fe621b.png"
            /><span>Kuda Bank</span>
          </div>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion_wrapper" style="display: none">
          <div class="accordion_content">
            <div class="accordion">
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with Kuda Bank App</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="kuda_bank_rule_tip_mobile"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Log in to your
                          <strong>KUDA BANK MOBILE APP</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> Click on <strong>PAYMENT</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Click on <strong>PAY A BILL</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> Click on <strong>BETTING</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> Click on <strong>SPORTYBET</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">6.</span> Enter the amount and the phone number
                          linked to your SportyBet wallet.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">7.</span> A successful notification will be
                          displayed and your SportyBet account will be credited instantly.
                        </div>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title">
                    <span>Deposit with Kuda Bank Website</span>
                  </div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="kuda_bank_rule_tip_website"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Log in to your
                          <strong>KUDA BANK WEBSITE</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> Click on <strong>PAYMENT</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Click on <strong>PAY A BILL</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> Click on <strong>BETTING</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> Click on <strong>SPORTYBET</strong>.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">6.</span> Enter the amount and the phone number
                          linked to your SportyBet wallet.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">7.</span> A successful notification will be
                          displayed and your SportyBet account will be credited instantly.
                        </div>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion_trigger">
          <div class="accordion_title">
            <img
              src="//s.sporty.net/global/main/brand/sportybet/mobile/images/opay.0f5bb9080a.png"
            /><span>OPay</span>
          </div>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion_wrapper" style="display: none">
          <div class="accordion_content">
            <div class="accordion">
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with Opay APP</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span data-cms-key="opay_deposit_guide" data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span> Log into your OPay App.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span> From the home page, click on “Betting” and
                          select Sportybet from the list.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span> Enter your Sportybet Phone Number:
                          080xxxxxxxx and the amount you wish to deposit.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span> Confirm all your details are correct and
                          select your preferred payment method.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span> Upon successful payment, you will receive
                          a notification and your betting wallet will be credited instantly.
                        </div>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <div class="accordion_trigger">
          <div class="accordion_title">
            <img
              src="//s.sporty.net/global/main/brand/sportybet/mobile/images/palmpay.338db53b69.png"
            /><span>Palmpay</span>
          </div>
          <i class="arrow-icon"></i>
        </div>
        <div class="accordion_wrapper" style="display: none">
          <div class="accordion_content">
            <div class="accordion">
              <div class="accordion-item">
                <div class="accordion_trigger">
                  <div class="accordion_title"><span>Deposit with Palmpay App</span></div>
                  <i class="arrow-icon"></i>
                </div>
                <div class="accordion_wrapper" style="display: none">
                  <div class="accordion_content">
                    <span
                      data-cms-key="palmpay_deposit_guide"
                      data-cms-page="common_payment_providers"
                      ><div class="bank-content-rule">
                        <div class="bank-content-rule__item">
                          <span class="bank-no">1.</span>Login into PalmPay App.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">2.</span>From the homepage, click on “Betting” and
                          select Sportybet from the billers list.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">3.</span>Enter Sportybet Phone number and click the
                          amount you wish to deposit.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">4.</span>Input your transaction pin and complete
                          your payment.
                        </div>
                        <div class="bank-content-rule__item">
                          <span class="bank-no">5.</span>Transaction successful and your Sportybet
                          account funded instantly.
                        </div>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
#direct-bank-container {
  margin-bottom: 1.66666667rem;
}
#direct-bank-container .visit-link,
#direct-bank-container .btn {
  background-color: #0d9737;
  background-color: var(--brand-secondary);
  border: 1px solid #0d9737;
  border-radius: 0.16666667rem;
  display: block;
  font-size: 1.066rem;
  font-weight: bold;
  height: 4rem;
  line-height: 4rem;
  margin: 1.33333333rem 0;
  text-align: center;
  color: #ffffff;
  color: var(--brand-tertiary);
  border-color: #0d9737;
  border-color: var(--brand-secondary);
}
#direct-bank-container .visit-link.secondary,
#direct-bank-container .btn.secondary {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: #0d9737;
  color: var(--brand-secondary);
}
#direct-bank-container .transaction-link,
#direct-bank-container .btn__line {
  color: #0d9737;
  color: var(--brand-secondary);
  display: block;
  font-size: 1.066rem;
  margin: 1.33333333rem 0;
  text-align: center;
}
#direct-bank-container .transaction-link .arrow-right::before,
#direct-bank-container .btn__line .arrow-right::before {
  color: #0d9737;
  color: var(--brand-secondary);
  content: '﹥';
  font-size: 1.066rem;
}
#direct-bank-container .bank-content-rule {
  margin: 0.41666667rem 0;
}
#direct-bank-container .bank-content-rule__item {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 1rem;
  line-height: 1.33333333rem;
  margin: 0.5rem 0;
  padding: 0 1.33333333rem;
  position: relative;
}
#direct-bank-container .bank-content-rule__item .bank-no {
  left: 0;
  position: absolute;
}
#direct-bank-container .bank-content-rule__item .bank-em {
  font-weight: bold;
}
#direct-bank-container .bank-content-rule__item a,
#direct-bank-container .bank-content-rule__item .bank-link {
  color: #0d9737;
  color: var(--brand-secondary);
}
.accordion-item {
  font-size: 14px;
}
.accordion_title {
  color: #353a45;
  color: var(--text-type1-primary);
}
.accordion_title img {
  height: 20px;
  margin-right: 16px;
  -o-object-fit: contain;
  object-fit: contain;
  width: 30px;
}
.accordion_trigger {
  border-bottom: 1px solid #eaecef;
  cursor: pointer;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  padding: 16px;
  border-bottom-color: #eaecef;
  border-bottom-color: var(--brand-border-type1);
}
.accordion_trigger_active {
  border-bottom: none;
  background-color: #fafafa;
  background-color: var(--background-general-primary);
}
.accordion_trigger_active .arrow-icon:before {
  -webkit-transform: translate3d(0, -1px, 0);
  transform: translate3d(0, -1px, 0);
}
.accordion_content {
  font-size: 12px;
  padding: 16px 16px 20px 16px;
}
.arrow-icon {
  color: #0d9737;
  color: var(--brand-quaternary);
}
.arrow-icon::before {
  content: '\e603';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.arrow-icon:before {
  display: inline-block;
  font-size: 10px;
  line-height: 1;
  -webkit-transform: translate3d(0, -2px, 0) rotate(-90deg);
  transform: translate3d(0, -2px, 0) rotate(-90deg);
  -webkit-transition: 0.3s;
  transition: 0.3s;
}
.accordion-enter-active,
.accordion-leave-active {
  overflow: hidden;
  -webkit-transition:
    height 0.3s ease,
    opacity 0.3s ease;
  transition:
    height 0.3s ease,
    opacity 0.3s ease;
  will-change: height, opacity;
}
.accordion-enter,
.accordion-leave-to {
  height: 0 !important;
  opacity: 0;
}

.bank-content-rule {
  margin: 5px 0;
}
.bank-content-rule__item {
  color: #9ca0ab;
  position: relative;
  padding: 0 16px;
  font-size: 12px;
  margin: 6px 0;
  line-height: 16px;
}
.bank-content-rule__item .bank-no {
  position: absolute;
  left: 0;
}
.bank-content-rule__item .bank-em {
  font-weight: bold;
}
.bank-content-rule__item a,
.bank-content-rule__item .bank-link {
  color: #0d9737;
}
</style>
