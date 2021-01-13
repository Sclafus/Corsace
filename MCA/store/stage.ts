import { ActionTree, MutationTree, GetterTree } from "vuex";
import axios from "axios";
import { UserCondensedInfo } from "../../interfaces/user";
import { RootState } from ".";
import { CategoryStageInfo } from "../../interfaces/category";
import { BeatmapsetInfo } from "../../interfaces/beatmap";

export type SectionCategory = "beatmaps" | "users";

export interface StageQuery {
    category: number;
    option: string;
    order: string;
    text: string;
    skip: number;
}

interface StageState {
    section: SectionCategory,
    categories: CategoryStageInfo[];
    selectedCategory: CategoryStageInfo | null;
    nominations: [];
    year: number;
    stage: string;
    count: number;
    beatmaps: BeatmapsetInfo[];
    users: UserCondensedInfo[];
    query: StageQuery;
}

export const state = (): StageState => ({
    section: "beatmaps",
    selectedCategory: null,
    categories: [],
    nominations: [],
    year: (new Date).getUTCFullYear() - 1,
    stage: "nominating",
    count: 0,
    beatmaps: [],
    users: [],
    query: {
        category: 0,
        option: "",
        order: "",
        text: "",
        skip: 0,
    },
});

export const mutations: MutationTree<StageState> = {
    updateYear (state, year) {
        if (/^20\d\d$/.test(year)) {
            state.year = parseInt(year);
        }
    },
    updateStage (state, stage) {
        state.stage = stage;
    },
    updateCategories (state, categories) {
        state.categories = categories || [];
    },
    updateNominations (state, nominations) {
        state.nominations = nominations || [];
    },
    updateCount (state, count) {
        state.count = count || 0;
    },
    updateBeatmaps (state, beatmaps) {
        state.beatmaps = beatmaps || [];
    },
    updateUsers (state, users) {
        state.users = users || [];
    },
    updateCategory (state, category) {
        state.selectedCategory = category;
    },
    updateSection (state, section) {
        if (state.section !== section) {
            state.section = section;
        }
    },
    updateQuery (state, query) {
        state.query = {
            ...state.query,
            ...query,
        };
    },
    updateBeatmapState (state, beatmapId) {
        const i = state.beatmaps.findIndex(b => b.id === beatmapId);
        if (i !== -1) state.beatmaps[i].chosen = !state.beatmaps[i].chosen;
    },
    updateUserState (state, userId) {
        const i = state.users.findIndex(u => u.corsaceID === userId);
        if (i !== -1) state.users[i].chosen = !state.users[i].chosen;
    },
    updateCategoryCount (state, payload) {
        const i = state.categories.findIndex(category => category.id === payload.categoryId);

        if (i === -1) return;
            
        if (payload.chosen)
            state.categories[i].count++;
        else
            state.categories[i].count--;
    },
    reset (state) {
        state.section = "beatmaps";
        state.selectedCategory = null;
        state.beatmaps = [];
        state.users = [];
        state.count = 0;
    },
};

export const getters: GetterTree<StageState, RootState> = {
    
};

export const actions: ActionTree<StageState, RootState> = {
    updateYear ({ commit }, year) {
        commit("updateYear", year);
    },
    updateStage ({ commit }, stage) {
        commit("updateStage", stage);
    },
    async setInitialData ({ state, commit, dispatch }) {
        const { data } = await axios.get(`/api/${state.stage}/${state.year}`);

        if (data.error) {
            console.error(data.error);
            return;
        }

        commit("updateCategories", data.categories);
        commit("updateNominations", data.nominations);

        if (data.categories?.length) {
            await dispatch("updateCategory", data.categories[0]);
        }
    },
    async updateCategory ({ commit, dispatch }, category) {
        commit("updateCategory", category);
        dispatch("search");
    },
    async updateSection ({ commit }, section) {
        commit("updateSection", section);
    },
    async updateQuery ({ commit, dispatch }, query) {
        commit("updateQuery", query);
        dispatch("search");
    },
    async search ({ state, commit, rootState }, skipping = false) {
        if (!state.selectedCategory) return;

        let skip = 0;

        if (skipping) {
            if (state.selectedCategory.type === "Users") skip = state.users.length;
            else if (state.selectedCategory.type === "Beatmapsets") skip = state.beatmaps.length;
        }

        const { data } = await axios.get(`/api/nominating/${state.year}/search?mode=${rootState.selectedMode}&category=${state.selectedCategory.id}&option=${state.query.option}&order=${state.query.order}&text=${state.query.text}&skip=${skip}`);
        if (data.error)
            return alert(data.error);

        commit("updateCount", data.count);

        if (!data.list) return;

        if (state.selectedCategory.type === "Users") {
            let users = data.list;
            if (skipping) users = [...state.users, ...data.list];
            commit("updateUsers", users.filter((val, i, self) => self.findIndex(v => v.corsaceID === val.corsaceID) === i));
        } else if (state.selectedCategory.type === "Beatmapsets") {
            let beatmaps = data.list;
            if (skipping) beatmaps = [...state.beatmaps, ...data.list];
            commit("updateBeatmaps", beatmaps.filter((val, i, self) => self.findIndex(v => v.id === val.id) === i));
        }
    },
    updateBeatmapState ({ commit, state }, beatmapId) {
        commit("updateBeatmapState", beatmapId);
        const beatmap = state.beatmaps.find(b => b.id === beatmapId);
        if (beatmap) commit("updateCategoryCount", beatmap.chosen);
    },
    updateUserState ({ commit, state }, userId) {
        commit("updateUserState", userId);
        const user = state.users.find(u => u.corsaceID === userId);
        if (user) commit("updateCategoryCount", user.chosen);
    },
    reset ({ commit }) {
        commit("reset");
    },
};
