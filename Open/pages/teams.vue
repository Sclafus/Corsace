<template>
    <div class="teams_list">
        <div 
            v-if="filteredTeams"
            class="teams_list__main_content"
        >
            <OpenTitle>
                {{ $t('open.teams.teamsList') }}
                <template #buttons>
                    <SearchBar
                        :placeholder="`${$t('open.teams.searchPlaceholder')}`"
                        style="margin-bottom: 10px;"
                        @update:search="searchValue = $event"
                    />
                </template>
            </OpenTitle>
            <div class="teams_list__main_content_list">
                <OpenCardTeam
                    v-for="team in filteredTeams"
                    :key="team.ID"
                    :team="team"
                />
            </div>
        </div>
        <div
            v-else-if="loading"
            class="teams_list__main_content"
        >
            <OpenTitle>
                {{ $t('open.status.loading') }}...
            </OpenTitle>
        </div>
        <div
            v-else 
            class="teams_list__main_content"
        >
            <OpenTitle>
                {{ $t('open.teams.error') }}...
            </OpenTitle>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { Tournament } from "../../Interfaces/tournament";
import { TeamList } from "../../Interfaces/team";

import OpenTitle from "../../Assets/components/open/OpenTitle.vue";
import OpenCardTeam from "../../Assets/components/open/OpenCardTeam.vue";
import SearchBar from "../../Assets/components/SearchBar.vue";

const openModule = namespace("open");

@Component({
    components: {
        OpenTitle,
        OpenCardTeam,
        SearchBar,
    },
    head () {
        return {
            title: this.$store.state["open"].title,
            meta: [
                {hid: "description", name: "description", content: this.$store.state["open"].tournament.description},

                {hid: "og:site_name", property: "og:site_name", content: this.$store.state["open"].title},
                {hid: "og:title", property: "og:title", content: this.$store.state["open"].title},
                {hid: "og:url", property: "og:url", content: `https://open.corsace.io${this.$route.path}`}, 
                {hid: "og:description", property: "og:description", content: this.$store.state["open"].tournament.description},
                {hid: "og:image",property: "og:image", content: require("../../Assets/img/site/open/banner.png")},
                
                {name: "twitter:title", content: this.$store.state["open"].title},
                {name: "twitter:description", content: this.$store.state["open"].tournament.description},
                {name: "twitter:image", content: require("../../Assets/img/site/open/banner.png")},
                {name: "twitter:image:src", content: require("../../Assets/img/site/open/banner.png")},
            ],
            link: [{rel: "canonical", hid: "canonical", href: `https://open.corsace.io${this.$route.path}`}],
        };
    },
})
export default class Teams extends Vue {
    @openModule.State tournament!: Tournament | null;
    @openModule.State teamList!: TeamList[] | null;

    loading = true;
    searchValue = "";

    get filteredTeams () {
        if (!this.searchValue)
            return this.teamList;
        return this.teamList?.filter(team => 
            team.name.toLowerCase().includes(this.searchValue.toLowerCase()) ||
            team.members.some(member => member.username.toLowerCase().includes(this.searchValue.toLowerCase())) ||
            team.ID.toString().includes(this.searchValue.toLowerCase()) ||
            team.members.some(member => member.ID.toString().includes(this.searchValue.toLowerCase())) ||
            team.members.some(member => member.osuID.toLowerCase().includes(this.searchValue.toLowerCase()))
        );
    }

    async mounted () {
        this.loading = true;
        if (this.tournament)
            await this.$store.dispatch("open/setTeamList", this.tournament.ID);
        this.loading = false;
    }
}
</script>

<style lang="scss">
@import '@s-sass/_variables';

.teams_list {
    background: linear-gradient(180deg, #1F1F1F 0%, #131313 100%);

    &__main_content {
        align-self: center;
        position: relative;
        width: 65vw;
        padding: 35px;
        background: linear-gradient(180deg, #1B1B1B 0%, #333333 261.55%);

        &_list {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: flex-start;
            margin-top: 25px;
        }
    }
}
</style>