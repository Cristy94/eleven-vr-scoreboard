const UPDATE_INTERVAL_MS = 3000;
const API_URL = 'https://api3.elevenvr.com';
const LAST_MATCHES_SHOWN_COUNT = 1;
const QUERY_API_KEY = 'apiKey';
const QUERY_PARAM_USERID = 'user';
const QUERY_PARAM_ROWS_REVERSED = 'rowsReversed';
const QUERY_PARAM_AUTO_FLAGS = 'autoFlags';
const QUERY_PARAM_BESTOF = 'bestOf';
const QUERY_PARAM_COUNTRY_FLAG_1 = 'flag_1';
const QUERY_PARAM_COUNTRY_FLAG_2 = 'flag_2';

const INTERNAL_ENABLE_ACCOUNTS_CACHE = true;
const INTERNAL_ACCOUNTS_CACHE = {}; // Cache account data for user ID

const TEAM_NAME_1 = 'home';
const TEAM_NAME_2 = 'away';

let updateHandle = 0;

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get(QUERY_API_KEY);
const userID = urlParams.get(QUERY_PARAM_USERID);
const rowsReversed = urlParams.get(QUERY_PARAM_ROWS_REVERSED);
const bestOf = urlParams.get(QUERY_PARAM_BESTOF);
const flag_1 = urlParams.get(QUERY_PARAM_COUNTRY_FLAG_1);
const flag_2 = urlParams.get(QUERY_PARAM_COUNTRY_FLAG_2);
const autoFlags = urlParams.get(QUERY_PARAM_AUTO_FLAGS);
const homeWinsOffset = urlParams.get('home-offset') || 0;
const awayWinOffset = urlParams.get('away-offset') || 0;

const getValAsBoolean = (val) => !!val && val !== '0' && val !== 'false' ? true : false
const App = {
    data() {
        return {
            counter: 0,
            apiKey: apiKey || '',
            userID: userID || '60531',
            matches: [],
            homeMatchesWon: 0,
            awayMatchesWon: 0,
            rowsReversed: getValAsBoolean(rowsReversed),
            teams: [TEAM_NAME_1, TEAM_NAME_2],
            bestOf: bestOf || '',
            countries: countries,
            flag_1: flag_1 || '',
            flag_2: flag_2 || '',
            autoFlags: getValAsBoolean(autoFlags),
            apiFetchError: false,

        }
    },
    computed: {
        teamsReversed() {
            return this.teams.slice().reverse();
        }
    },
    watch: {
        rowsReversed: function (val) {
            if (val) {
                urlParams.set(QUERY_PARAM_ROWS_REVERSED, 1);
            } else {
                urlParams.delete(QUERY_PARAM_ROWS_REVERSED);
            }
            this.updateUrlParams();
        },

        apiKey: function (val) {
            urlParams.set(QUERY_API_KEY, val);
            this.updateUrlParams();
            this.updateMatches();
        },

        userID: function (val) {
            urlParams.set(QUERY_PARAM_USERID, val);
            this.updateUrlParams();
            this.updateMatches();
        },

        bestOf: function (val) {
            if (val) {
                urlParams.set(QUERY_PARAM_BESTOF, val);
            } else {
                urlParams.delete(QUERY_PARAM_BESTOF);
            }
            this.updateUrlParams();
        },

        flag_1: function (val) {
            if (val) {
                urlParams.set(QUERY_PARAM_COUNTRY_FLAG_1, val);
            } else {
                urlParams.delete(QUERY_PARAM_COUNTRY_FLAG_1);
            }
            this.updateUrlParams();
        },

        flag_2: function (val) {
            if (val) {
                urlParams.set(QUERY_PARAM_COUNTRY_FLAG_2, val);
            } else {
                urlParams.delete(QUERY_PARAM_COUNTRY_FLAG_2);
            }
            this.updateUrlParams();
        },

        autoFlags: function (val) {
            if (val) {
                urlParams.set(QUERY_PARAM_AUTO_FLAGS, 1);
            } else {
                urlParams.delete(QUERY_PARAM_AUTO_FLAGS);
            }
            this.updateUrlParams();
            this.loadAccountsAndSetFlags();
        },
    },
    methods: {
        getAPIURL(path) {
            return `${API_URL}${path}?api-key=${this.apiKey}`;
        },
        updateUrlParams() {
            history.pushState(null, null, "?" + urlParams.toString());
        },
        getFlag(teamName) {
            return teamName === TEAM_NAME_1 ? this.flag_1 : this.flag_2;
        },
        loadAccountsAndSetFlags() {
            if (!this.matches.length) {
                console.error('No matches found');
                return;
            }

            if (!this.autoFlags) {
                return;
            }

            const match = this.matches[0];
            const users = [match.attributes['home-user-id'], match.attributes['away-user-id']];

            const setFlagForAccount = (data, idx) => {
                const countryCode = data?.data?.attributes?.['country-code'];

                if (countryCode) {
                    this['flag_' + (idx + 1)] = countryCode.toLowerCase();
                }
            }
            for (const [idx, userID] of users.entries()) {

                if (INTERNAL_ENABLE_ACCOUNTS_CACHE && INTERNAL_ACCOUNTS_CACHE[userID]) {
                    setFlagForAccount(INTERNAL_ACCOUNTS_CACHE[userID], idx);
                } else {
                    fetch(this.getAPIURL(`/accounts/${userID}`))
                        .then(res => res.json())
                        .then(data => {
                            INTERNAL_ACCOUNTS_CACHE[userID] = data;
                            setFlagForAccount(data, idx);
                        })
                }

            }
        },
        updateMatches() {
            clearTimeout(updateHandle);
            fetch(this.getAPIURL(`/accounts/${this.userID}/matches`))
                .then(res => res.json())
                .then(data => {
                    this.apiFetchError = false;

                    // Count matches score for those opponents
                    let otherIDPrevious = -1;
                    this.homeMatchesWon = homeWinsOffset;
                    this.awayMatchesWon = awayWinOffset;
                    try {
                        for (const match of data.data) {
                            const user1 = match.attributes['home-user-id'];
                            const user2 = match.attributes['away-user-id'];

                            const otherID = user1 == this.userID ? user2 : user1;
                            if (otherIDPrevious === -1) {
                                otherIDPrevious = otherID
                            }

                            if (otherIDPrevious !== otherID) break; // End counting if no more games between those two
                            if (match.attributes.state !== 1) continue; // Don't count matches that are not over

                            if (match.attributes.winner === 0) {
                                this.homeMatchesWon++;
                            } else {
                                this.awayMatchesWon++;
                            }
                        }

                    } catch (e) {

                    }

                    const newMatches = data.data.slice(0, LAST_MATCHES_SHOWN_COUNT);
                    this.matches = newMatches.map((m) => {
                        let scores = m.relationships.rounds.data.map((r) => {
                            return data.included.find((inclRound) => inclRound.id == r.id && inclRound.type === r.type).attributes;
                        });

                        return {
                            ...m,
                            scores
                        }
                    })

                    // TODO: We do this every tick, maybe we could cache account info
                    // But what if account changes? How do we force refresh? Re-add OBS source?
                    this.loadAccountsAndSetFlags();
                }).catch(() => {
                    this.apiFetchError = true;
                });

            updateHandle = setTimeout(() => this.updateMatches(), UPDATE_INTERVAL_MS);
        },
    },

    mounted() {
        this.updateMatches();
    }
}

var app = Vue.createApp(App);

app.component('player', {
    props: ['player'],
    template: `
        <div class="player">
            <h3>
                <img v-if="player.flag" :src="'flags/'+player.flag + '.svg'" class="flag"/>{{ player.UserName }}
            </h3>
            <div class="player__info">
                <div>
                    WR#{{ player.Rank }} {{ Math.round(player.ELO) }}ELO
                </div>
            </div>
        </div>
    `
});

app.component('player-row', {
    props: ['match', 'teamName', 'matchesWon', 'flag'],
    methods: {
        isMatchOver(score) {
            return (score['home-score'] >= 11 || score['away-score'] >= 11) && Math.abs(score['home-score'] - score['away-score']) > 1;
        },
    },
    computed: {
        otherTeamName: function () {
            return this.teamName === TEAM_NAME_1 ? TEAM_NAME_2 : TEAM_NAME_1;
        },
        playerData: function () {
            return {
                ...this.match.attributes[this.teamName + '-team'][0],
                flag: this.flag,
            }
        }
    },
    template: `
        <div class="player-row">
            <player :player="playerData" />

            <div class="score score--matches">
                {{matchesWon}}
            </div>
            <div v-for="score in match.scores" class="score"
                :class="[isMatchOver(score) ? 'ended': 'running', score[teamName + '-score'] > score[otherTeamName + '-score'] ? 'win' :'lose']">
                {{score[teamName + '-score']}}
            </div>
        </div>
    `
});

app.mount('#app')