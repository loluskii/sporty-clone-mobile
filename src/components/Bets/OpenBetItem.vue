<template>
    <li data-op="openbet-item-wrapper" class="m-bet-item">
        <div>
            <div class="m-item-wrap">
                <div class="m-title" @click="isExpanded = !isExpanded">
                    <div><span style="text-transform: capitalize;" class="m-t-14 m-t-bold m-list-t-default">
                            {{ bet.betType === 'multi' ? 'Multiple' : bet.betType === 'single' ? 'Single' : bet.betType
                                === 'system' ? 'System':bet.betType }}
                        </span> <span data-op="openbet-item-live-tag" style="display: none;"><span
                                class="m-i-live m-t-b5" data-cms-key="live"
                                data-cms-page="common_functions">Live</span></span>
                        <div class="insure-info-block flexibet-title" data-op="openbet-item-sporty-insure"></div>
                    </div>
                    <div class="actions">
                        <div @click="shareTicket" class="icon-font-base icon-share" data-op="share-bet" role="button"
                            aria-label="Share Bet"></div>
                    </div>
                </div>
                <div :id="bet.id + '_bop'" class="simpleListItem" v-if="!isExpanded"
                    v-for="event in bet.selections.slice(0, 1)" :key="event.id">
                    <div class="info-container" @click="isExpanded = !isExpanded">
                        <span class="m-t-l20 m-t-14 m-list-t-default m-ellipsis">
                            {{ event.eventName }}
                        </span>
                        <div class="m-t-14 m-t-gray m-ellipsis"><span>Stake: </span><span
                                class="m-t-bold m-list-t-default m-t-mv5">{{ bet.stake }}</span>
                        </div>
                    </div>
                    <button class="af-button af-button--primary m-btn--cashout simple"
                        @click.prevent="handleCashout(bet)" :class="{ 'disabled is-disabled': !bet.estimatedCashout }"
                        :disabled="!bet.estimatedCashout || cashingOut || bet.isBonusBet" type="button"> <span><span
                                class="label">Cashout</span>
                            <div class="amount">
                                <span v-if="!cashingOut">{{
                                    bet.estimatedCashout && bet.estimatedCashout > 0 && !bet.isBonusBet
                                        ? `${SportsbookGlobalVariable.CurrencyCode}
                                    ${bet.estimatedCashout.toFixed(2)}`
                                        : 'Unavailable'
                                }}</span>
                            </div>
                        </span></button>
                </div>
                <template v-else>
                    <div class="m-sportsBet--detail">
                        <ul class="m-bet-sel">
                            <li v-for="event in bet.selections" :key="event.id" class="detail-content">
                                <div class="detail-content-left m-t-12 m-t-l16 m-t-bold m-t-default">
                                    <span>
                                        <span class="root">
                                            <svg v-if="event.status === -1" viewBox="0 0 24 24" fill="none"
                                                xmlns="http://www.w3.org/2000/svg" height="2rem" width="2rem"
                                                class="not-start svg-icon-base">
                                                <mask id="a" maskUnits="userSpaceOnUse" x="0" y="0" width="24"
                                                    height="24" style="mask-type: alpha;">
                                                    <path fill="currentColor" d="M0 0h24v24H0z"></path>
                                                </mask>
                                                <g mask="url(#a)">
                                                    <path
                                                        d="M14.97 16.23l1.26-1.26-3.33-3.33V7.5h-1.8v4.86l3.87 3.87zM12 21a8.762 8.762 0 01-3.51-.709 9.089 9.089 0 01-2.857-1.924 9.089 9.089 0 01-1.924-2.857A8.764 8.764 0 013 12c0-1.245.236-2.415.709-3.51a9.089 9.089 0 011.924-2.857A9.089 9.089 0 018.49 3.709 8.764 8.764 0 0112 3c1.245 0 2.415.236 3.51.709a9.089 9.089 0 012.857 1.924 9.089 9.089 0 011.924 2.857A8.762 8.762 0 0121 12a8.762 8.762 0 01-.709 3.51 9.089 9.089 0 01-1.924 2.857 9.089 9.089 0 01-2.857 1.924A8.762 8.762 0 0112 21zm0-1.8c1.995 0 3.694-.701 5.096-2.104C18.5 15.694 19.2 13.995 19.2 12s-.701-3.694-2.104-5.096C15.694 5.5 13.995 4.8 12 4.8s-3.694.701-5.096 2.104C5.5 8.306 4.8 10.005 4.8 12s.701 3.694 2.104 5.096C8.306 18.5 10.005 19.2 12 19.2z"
                                                        fill="currentColor"></path>
                                                </g>
                                            </svg>
                                            <svg v-else-if="event.status === 0" viewBox="0 0 24 24" fill="none"
                                                xmlns="http://www.w3.org/2000/svg" height="2rem" width="2rem"
                                                class="svg-icon-base">
                                                <circle cx="12" cy="12" r="7" fill="#fff"></circle>
                                                <path
                                                    d="M8.76 16.5L12 13.26l3.24 3.24 1.26-1.26L13.26 12l3.24-3.24-1.26-1.26L12 10.74 8.76 7.5 7.5 8.76 10.74 12 7.5 15.24l1.26 1.26zM12 21a8.764 8.764 0 01-3.51-.709 9.089 9.089 0 01-2.858-1.924A9.089 9.089 0 013.71 15.51a8.764 8.764 0 01-.71-3.51c0-1.245.237-2.415.71-3.51a9.089 9.089 0 011.923-2.858A9.089 9.089 0 018.49 3.71a8.764 8.764 0 013.51-.71c1.245 0 2.415.237 3.51.71a9.089 9.089 0 012.857 1.923 9.089 9.089 0 011.924 2.858A8.764 8.764 0 0121 12a8.764 8.764 0 01-.709 3.51 9.089 9.089 0 01-1.924 2.857 9.089 9.089 0 01-2.857 1.924A8.764 8.764 0 0112 21z"
                                                    fill="#E41827"></path>
                                            </svg>

                                            <svg v-else-if="event.status === 1" viewBox="0 0 24 25" fill="none"
                                                xmlns="http://www.w3.org/2000/svg" height="2rem" width="2rem"
                                                class="won svg-icon-base">
                                                <circle cx="12" cy="12.5" r="9" fill="currentColor"></circle>
                                                <path
                                                    d="M17 9.825L10.761 16.5 7 12.476l1.239-1.325 2.522 2.698 5-5.349L17 9.825z"
                                                    fill="#fff" stroke="#fff" stroke-width=".2"></path>
                                            </svg>

                                        </span>
                                    </span>
                                </div>
                                <div class="detail-content-right f-flex-item">
                                    <div class="m-t-14 m-t-l16 m-t-default f-wrap"><i class="m-r-5 m-icon-football"></i>
                                        <span data-op="openbet-detail-outcome-desc" class="m-r-5 m-t-bold"><span> {{
                                            event.outcomeName }}
                                            </span></span> <span data-op="openbet-detail-odds"
                                            class="m-t-bold m-r-5 m-b-5">
                                            @ {{ event.odds.toFixed(2) }}
                                        </span> <span data-op="openbet-detail-market-desc"
                                            class="m-t-14 m-t-gray m-b-5"><span>
                                                {{ event.marketName }}
                                            </span> </span>
                                    </div>
                                    <div class="m-against m-list-t-default m-t-14"><span
                                            data-op="openbet-detail-home-away">
                                            {{ event.eventName }}
                                        </span></div>
                                    <div class="m-score">
                                        <div class="m-score-info"><span> <span data-op="openbet-detail-period"
                                                    class="m-t-12 capitalize m-t-gray">
                                                    {{ formatDate(event.eventDate, 'DD/MM HH:mm') }}
                                                </span> <span class="m-t-12"></span></span></div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <div class="divider"></div>
                        <div class="f-flex m-opt" @click="isExpanded = false">
                            <div class="m-l-right"><span class="m-t-gray m-t-12 m-t-l14"><span>Hide Match
                                        Details</span> <i class="m-icon-pack"></i></span></div>
                        </div>
                    </div>

                    <div class="m-money f-flex m-list-t-default f-btwn m-t-12">
                        <div class="m-money__list">
                            <div data-cms-key="stake" data-cms-page="bet_history">Stake
                            </div>
                            <div class="m-t-bold amount">
                                {{ bet.stake }}
                            </div>
                        </div>
                        <div class="m-money__list">
                            <div class="label">
                                Pot. Win
                            </div>
                            <div class="m-t-bold m-t-ml6 amount">
                                {{ bet.possibleWin }}
                            </div>
                        </div>
                    </div>

                    <div v-if="bet.status === -1" class="m-btn-wrapper" :class="{ disabled: !bet.estimatedCashout }">
                        <button :disabled="!bet.estimatedCashout || cashingOut || bet.isBonusBet"
                            @click.prevent="handleCashout(bet)" type="button" class="m-btn--cashout">
                            <span v-if="!cashingOut">{{
                                bet.estimatedCashout && bet.estimatedCashout > 0 && !bet.isBonusBet
                                    ? `Cashout ${SportsbookGlobalVariable.CurrencyCode} ${bet.estimatedCashout.toFixed(2)}`
                                    : 'Cashout Unavailable'
                            }}</span>
                            <img v-else src="/loader.gif" height="24" width="24" alt="" srcset="" />
                        </button>
                    </div>
                </template>

                <div class="cashout-fallback-hint-area align-right"></div>
            </div>
        </div>
    </li>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import $ from 'jquery'
import { formatNumber, formatDate, slugify } from '@/helpers'
import { useUtilsStore } from '@/stores'

const props = defineProps({
    bet: {
        type: Object,
        required: true
    },
    index: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(['cashout'])

const router = useRouter()
const { SportsbookGlobalVariable } = useUtilsStore()
const cashingOut = ref(false)
const isExpanded = ref(false)

function handleCashout(bet) {
    emit('cashout', bet)
}

function shareTicket() {
    // TODO: implement share functionality
}

function goToEvent(event) {
    if (!event.isLive) {
        return router.push({
            name: 'fixtures-detail',
            params: {
                sport: slugify(event.sport),
                tournament_name: slugify(event.tournament),
                event_name: slugify(event.eventName),
                event_id: event.matchId
            }
        })
    } else {
        return router.push({
            name: 'live-fixtures-detail',
            params: {
                sport: slugify(event.sport),
                tournament_name: slugify(event.tournament),
                event_name: slugify(event.eventName),
                event_id: event.matchId
            }
        })
    }
}

function showChild(e, index) {
    let y = $(e.target).hasClass('hide')
    if (y) {
        $(e.target).removeClass('hide')
    } else {
        $(e.target).addClass('hide')
    }
    $('#' + index + '_bop').toggleClass('d-none')
    $('#' + index + '_child').toggleClass('d-none')
}
</script>

<style scoped>
/* Bet Item Container */
.m-bet-item {
    background: #ffffff;
    border-radius: 0.16666667rem;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.3);
    box-sizing: border-box;
    margin-bottom: 0.83333333rem;
    width: 100%;
}

.m-item-wrap {
    padding: 0 1rem 1rem;
}

/* Title Section */
.m-title {
    align-items: center;
    border-bottom: 1px solid #eaecef;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    padding: 0.91666667rem 0 0.75rem 0;
}

.m-title>div {
    align-items: center;
    display: flex;
}

/* Against List */
.m-against {
    box-sizing: border-box;
    font-size: 0;
    padding: 0.83333333rem 0;
}

.m-against>li {
    margin-bottom: 0.33333333rem;
}

/* Bet Selection List */
.m-bet-sel .f-flex {
    align-items: flex-start;
    border-bottom: 1px solid #eaecef;
    box-sizing: border-box;
    padding: 1.066rem 0;
}

.m-bet-sel .f-flex:last-of-type {
    border-bottom: none;
}

.m-bet-sel .m-l-left,
.m-bet-sel .m-l-right {
    display: table-cell;
    vertical-align: top;
}

.m-bet-sel .m-l-left {
    width: 2rem;
}

.m-bet-sel .m-aginst {
    padding-top: 0.41666667rem;
    text-decoration: underline;
}

.m-bet-sel .m-score {
    margin-top: 0.41666667rem;
}

/* Money Section */
.m-money {
    align-items: center;
    box-sizing: border-box;
    padding-top: 0.66666667rem;
    width: 100%;
}

.m-money__lr {
    max-width: 70%;
    overflow: hidden;
}

.m-money .amount {
    overflow: hidden;
    padding-top: 0.66666667rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Button Wrapper */
.m-btn-wrapper {
    display: flex;
    padding-top: 0.83333333rem;
    text-align: center;
    width: 100%;
}

.m-btn-wrapper .m-btn--cashout {
    background: var(--brand-secondary);
    border: none;
    border-radius: 2px;
    color: #ffffff;
    font-size: 1rem;
    font-weight: bold;
    height: 3.33333333rem;
    line-height: 1.58333333rem;
    outline: none;
    text-align: center;
    width: 100%;
}

.m-btn-wrapper .m-btn--cashout.changed {
    background: #096b27;
}

.m-btn-wrapper.disabled .m-btn--cashout {
    background: #dcdee5;
    color: #ffffff;
}

/* Utility Classes */
.f-flex {
    display: flex;
}

.f-btwn {
    justify-content: space-between;
}

.f-wrap {
    display: flex;
    flex-wrap: wrap;
}

.f-flex-item {
    flex: 1;
    min-width: 1%;
}

.align-r {
    text-align: right;
}

/* Typography */
.m-t-12 {
    font-size: 1rem;
    line-height: 1;
}

.m-t-14 {
    font-size: 1rem;
}

.m-t-l16 {
    line-height: 1.33333333rem;
}

.m-t-bold {
    font-weight: 600;
}

.m-t-b5 {
    font-weight: 500;
}

.m-t-black {
    color: #353a45;
}

.m-t-dark {
    color: #1b1e25;
}

.m-t-gray {
    color: #9ca0ab;
}

.m-t-ml6 {
    margin-left: 0.5rem;
}

.m-r-5 {
    margin-right: 0.41666667rem;
}

.m-r-20 {
    margin-right: 1.66666667rem;
}

.m-b-5 {
    margin-bottom: 0.41666667rem;
}

.m-sportBets .m-t-mv5 {
    margin: 0.41666667rem;
}

.m-sportBets .m-r-5 {
    margin-right: 0.41666667rem;
}

.m-sportBets .m-r-20 {
    margin-right: 1.66666667rem;
}

.m-sportBets .m-t-ml2 {
    margin-left: 0.16666667rem;
}

.m-sportBets .m-b-5 {
    margin-bottom: 0.41666667rem;
}

.m-sportBets .m-t-12 {
    font-size: 1rem;
    line-height: 1;
}

.m-sportBets .m-t-14 {
    font-size: 1rem;
}

.m-sportBets .m-t-16 {
    font-size: 1.33333333rem;
    line-height: 1;
}

.m-sportBets .m-t-19 {
    font-size: 1.58333333rem;
    line-height: 1;
}

.m-sportBets .m-t-20 {
    font-size: 1.66666667rem;
    line-height: 1;
}

.m-sportBets .m-l-23 {
    line-height: 1.91666667rem;
}

.m-sportBets .m-t-l14 {
    line-height: 1.066rem;
}

.m-sportBets .m-t-l16 {
    line-height: 1.33333333rem;
}

.m-sportBets .m-t-l20 {
    line-height: 1.66666667rem;
}

.m-sportBets .m-t-white {
    color: #ffffff;
}

.m-sportBets .m-t-gray {
    color: #9ca0ab;
}

.m-sportBets .m-t-green {
    color: #0d9737;
}

.m-sportBets .m-t-dgreen {
    color: #096b27;
}

.m-sportBets .m-t-lblue {
    color: #3656a3;
}

.m-sportBets .m-t-red {
    color: #e41827;
}

.m-sportBets .m-t-center {
    text-align: center;
}

.m-sportBets .m-t-right {
    text-align: right;
}

.m-sportBets .m-t-bold {
    font-weight: 600;
}

.m-sportBets .m-t-b5 {
    font-weight: 500;
}

.m-sportBets .m-t-mt4 {
    margin-top: 0.33333333rem;
}

.m-sportBets .m-t-ml6 {
    margin-left: 0.5rem;
}

.m-sportBets .m-t-mt18 {
    margin-top: 1.5rem;
}

.m-sportBets .m-t-mv3 {
    margin: 0.16666667rem;
}

.m-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.capitalize {
    text-transform: capitalize;
}

/* Live Badge */
.m-i-live {
    background-color: #d6ebdc;
    border-radius: 2px;
    color: #0d9737;
    font-size: 0.83333333rem;
    margin-left: 0.5rem;
    padding: 0.16666667rem 0.33333333rem;
}

.bg-green-200 {
    background-color: #d6ebdc;
}

/* Hidden utility */
.d-none {
    display: none !important;
}

.simpleListItem {
    -webkit-box-align: center;
    -webkit-align-items: center;
    -ms-flex-align: center;
    align-items: center;
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    padding: 0.83333333rem 0 0;
}

.simpleListItem .info-container {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -webkit-flex-direction: column;
    -ms-flex-direction: column;
    flex-direction: column;
    font-size: 1.16666667rem;
    -webkit-box-pack: justify;
    -webkit-justify-content: space-between;
    -ms-flex-pack: justify;
    justify-content: space-between;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 65%;
}

.simpleListItem .m-btn--cashout.simple {
    -webkit-box-align: center;
    -webkit-align-items: center;
    -ms-flex-align: center;
    align-items: center;
    background: #0D9737;
    border-color: #0D9737;
    border-radius: 0.16666667rem;
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-flex: 1;
    -webkit-flex: 1;
    -ms-flex: 1;
    flex: 1;
    font-size: 1rem;
    font-weight: bold;
    -webkit-box-pack: center;
    -webkit-justify-content: center;
    -ms-flex-pack: center;
    justify-content: center;
    line-height: 1.2;
    margin-left: 0.41666667rem;
    min-height: 3.33333333rem;
    padding: 0.5rem 0.41666667rem;
    width: 38%;
}

.simpleListItem .m-btn--cashout span {
    display: inline-block;
    font-weight: bold;
    vertical-align: middle;
    white-space: initial;
}

.simpleListItem .m-btn--cashout span.label {
    font-weight: 500;
}

.simpleListItem .m-btn--cashout.changed {
    background: #096B27;
    background: var(--brand-type2-secondary);
}

.simpleListItem .m-btn--cashout.disabled {
    background: #DCDEE5 !important;
    background: var(--disable-brand-secondary) !important;
    border-color: #DCDEE5 !important;
    border-color: var(--disable-brand-secondary) !important;
}

.m-bet-sel .f-flex {
    -webkit-box-align: start;
    -webkit-align-items: flex-start;
    -ms-flex-align: start;
    align-items: flex-start;
    border-bottom: 1px solid #EAECEF;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    padding: 1.16666667rem 0;
    border-color: #EAECEF;
    border-color: var(--line-type1-primary);
}

.m-bet-sel .f-flex:last-of-type {
    border-bottom: none;
}

.m-bet-sel .detail-content {
    border-color: #EAECEF;
    border-bottom-style: solid;
    border-bottom-width: 1px;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    display: grid;
    grid-template-areas: "left right" "bottom bottom";
    grid-template-columns: 5.33333333rem 1fr;
    padding: 1.16666667rem 0;
}

.m-bet-sel .detail-content:last-of-type {
    border-bottom: none;
}

.m-bet-sel .detail-content-left {
    grid-area: left;
}

.m-bet-sel .detail-content-right {
    grid-area: right;
}

.m-bet-sel .detail-content-bottom {
    grid-area: bottom;
    margin-top: 0.16666667rem;
}

.m-bet-sel .m-market {
    margin-top: 0.5rem;
}

.m-bet-sel .m-against {
    padding-bottom: 0;
    padding-top: 0.41666667rem;
    text-decoration: underline;
}

.m-bet-sel .m-icon-banker {
    background-color: #353A45;
    background-color: var(--background-type2-secondary);
    border-radius: 50%;
    display: inline-block;
    height: 0.91666667rem;
    line-height: 0.91666667rem;
    margin-left: 0.41666667rem;
    text-align: center;
    width: 0.91666667rem;
}

.m-bet-sel .m-icon-banker:before {
    color: #FFFFFF;
    color: var(--text-type2-primary);
    content: 'B';
    font-size: 0.83333333rem;
    line-height: 1;
}

.m-bet-sel .delayed-icon {
    padding-top: 0.66666667rem;
    width: 1rem;
}

.m-bet-sel .m-live-odds {
    line-height: 2;
}

.m-bet-sel .m-live-odds .m-icon-live {
    background-color: #D6EBDC;
    background-color: var(--c-openbet-live-odds-bg);
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    font-size: 1.16666667rem;
    height: 1.16666667rem;
    line-height: 1.33333333rem;
    padding: 0.25rem 0.25rem;
    text-align: center;
    color: #2c3343;
    color: var(--c-openbet-live-odds-text);
}

.m-bet-sel .m-live-odds .m-odds {
    color: #353A45;
    color: var(--text-type1-primary);
    display: inline-block;
    font-size: 1.16666667rem;
    font-weight: bold;
    margin-left: 0.25rem;
}

.m-bet-sel .m-live-odds .m-odds-desc {
    background-color: #EAECEF;
    background-color: var(--background-type1-tertiary);
    color: #9CA0AB;
    color: var(--text-type1-secondary);
    display: inline-block;
    font-size: 0.83333333rem;
    font-weight: bold;
    line-height: 1.16666667rem;
    padding: 0 0.33333333rem;
    text-transform: capitalize;
}

.m-bet-sel .m-live-odds .m-odds--up {
    color: #0D9737;
    line-height: 1;
    margin-left: 0.33333333rem;
}

.m-bet-sel .m-live-odds .m-odds--up::before {
    content: '\e609';
    font-family: "iconfont" !important;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-style: normal;
}

.m-bet-sel .m-live-odds .m-odds--down {
    color: #e41827;
    color: var(--warning-primary);
    line-height: 1;
    margin-left: 0.33333333rem;
}

.m-bet-sel .m-live-odds .m-odds--down::before {
    content: '\e605';
    font-family: "iconfont" !important;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-style: normal;
}

.m-bet-sel .m-score {
    -webkit-box-align: center;
    -webkit-align-items: center;
    -ms-flex-align: center;
    align-items: center;
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: justify;
    -webkit-justify-content: space-between;
    -ms-flex-pack: justify;
    justify-content: space-between;
    margin-top: 0.5rem;
}

.m-bet-sel .m-score .m-score-info {
    -webkit-box-align: center;
    -webkit-align-items: center;
    -ms-flex-align: center;
    align-items: center;
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    height: 2.33333333rem;
}

.m-bet-sel .m-score .live-content-wrapper {
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    height: 2.33333333rem;
    margin-left: 0.33333333rem;
}

.divider {
    border-top: 1px solid #EAECEF;
}
</style>