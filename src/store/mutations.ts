/*
 * Copyright 2020 James Lyne
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import {MutationTree} from "vuex";
import {MutationTypes} from "@/store/mutation-types";
import {State} from "@/store/state";
import {
	DynmapArea,
	DynmapCircle,
	DynmapComponentConfig,
	DynmapLine, DynmapMarker,
	DynmapMarkerSet,
	DynmapMarkerSetUpdates,
	DynmapPlayer,
	DynmapServerConfig, DynmapTileUpdate,
	DynmapChat
} from "@/dynmap";
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";
import {
	Coordinate, LiveAtlasWorldState,
	LiveAtlasMessageConfig,
	LiveAtlasServerDefinition,
	LiveAtlasSidebarSection,
	LiveAtlasSortedPlayers,
	LiveAtlasUIElement, LiveAtlasWorld, LiveAtlasParsedUrl
} from "@/index";

export type CurrentMapPayload = {
	worldName: string;
	mapName: string;
	realWorldName: string;
}

export type Mutations<S = State> = {
	[MutationTypes.INIT](state: S): void
	[MutationTypes.SET_SERVERS](state: S, servers: Map<string, LiveAtlasServerDefinition>): void
	[MutationTypes.SET_CONFIGURATION](state: S, config: DynmapServerConfig): void
	[MutationTypes.SET_CONFIGURATION_HASH](state: S, hash: number): void
	[MutationTypes.CLEAR_CONFIGURATION_HASH](state: S): void
	[MutationTypes.SET_MESSAGES](state: S, messages: LiveAtlasMessageConfig): void
	[MutationTypes.SET_WORLDS](state: S, worlds: Array<LiveAtlasWorld>): void
	[MutationTypes.CLEAR_WORLDS](state: S): void
	[MutationTypes.SET_COMPONENTS](state: S, worlds: DynmapComponentConfig): void
	[MutationTypes.SET_MARKER_SETS](state: S, worlds: Map<string, DynmapMarkerSet>): void
	[MutationTypes.CLEAR_MARKER_SETS](state: S): void
	[MutationTypes.ADD_WORLD](state: S, world: LiveAtlasWorld): void
	[MutationTypes.SET_WORLD_STATE](state: S, worldState: LiveAtlasWorldState): void
	[MutationTypes.SET_UPDATE_TIMESTAMP](state: S, time: Date): void
	[MutationTypes.ADD_MARKER_SET_UPDATES](state: S, updates: Map<string, DynmapMarkerSetUpdates>): void
	[MutationTypes.ADD_TILE_UPDATES](state: S, updates: Array<DynmapTileUpdate>): void
	[MutationTypes.ADD_CHAT](state: State, chat: Array<DynmapChat>): void

	[MutationTypes.POP_MARKER_UPDATES](state: S, payload: {markerSet: string, amount: number}): void
	[MutationTypes.POP_AREA_UPDATES](state: S, payload: {markerSet: string, amount: number}): void
	[MutationTypes.POP_CIRCLE_UPDATES](state: S, payload: {markerSet: string, amount: number}): void
	[MutationTypes.POP_LINE_UPDATES](state: S, payload: {markerSet: string, amount: number}): void
	[MutationTypes.POP_TILE_UPDATES](state: S, amount: number): void

	[MutationTypes.INCREMENT_REQUEST_ID](state: S): void
	[MutationTypes.SET_PLAYERS_ASYNC](state: S, players: Set<DynmapPlayer>): Set<DynmapPlayer>
	[MutationTypes.SYNC_PLAYERS](state: S, keep: Set<string>): void
	[MutationTypes.CLEAR_PLAYERS](state: S): void
	[MutationTypes.SET_CURRENT_SERVER](state: S, server: string): void
	[MutationTypes.SET_CURRENT_MAP](state: S, payload: CurrentMapPayload): void
	[MutationTypes.SET_CURRENT_PROJECTION](state: S, payload: DynmapProjection): void
	[MutationTypes.SET_CURRENT_LOCATION](state: S, payload: Coordinate): void
	[MutationTypes.SET_CURRENT_ZOOM](state: S, payload: number): void
	[MutationTypes.SET_PARSED_URL](state: S, payload: LiveAtlasParsedUrl): void
	[MutationTypes.CLEAR_PARSED_URL](state: S): void
	[MutationTypes.CLEAR_CURRENT_MAP](state: S): void
	[MutationTypes.SET_FOLLOW_TARGET](state: S, payload: DynmapPlayer): void
	[MutationTypes.SET_PAN_TARGET](state: S, payload: DynmapPlayer): void
	[MutationTypes.CLEAR_FOLLOW_TARGET](state: S, a?: void): void
	[MutationTypes.CLEAR_PAN_TARGET](state: S, a?: void): void

	[MutationTypes.SET_SMALL_SCREEN](state: S, payload: boolean): void
	[MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY](state: S, payload: LiveAtlasUIElement): void
	[MutationTypes.SET_UI_ELEMENT_VISIBILITY](state: S, payload: {element: LiveAtlasUIElement, state: boolean}): void

	[MutationTypes.TOGGLE_SIDEBAR_SECTION_COLLAPSED_STATE](state: S, section: LiveAtlasSidebarSection): void
	[MutationTypes.SET_SIDEBAR_SECTION_COLLAPSED_STATE](state: S, payload: {section: LiveAtlasSidebarSection, state: boolean}): void

	[MutationTypes.SET_LOGGED_IN](state: S, payload: boolean): void
}

export const mutations: MutationTree<State> & Mutations = {
	[MutationTypes.INIT](state: State) {
		const collapsedSections = localStorage.getItem('collapsedSections');

		if(collapsedSections) {
			state.ui.sidebar.collapsedSections = new Set(JSON.parse(collapsedSections));
		}
	},

	// Sets configuration options from the initial config fetch
	[MutationTypes.SET_SERVERS](state: State, config: Map<string, LiveAtlasServerDefinition>) {
		state.servers = config;

		if(state.currentServer && !state.servers.has(state.currentServer.id)) {
			state.currentServer = undefined;
		}
	},

	// Sets configuration options from the initial config fetch
	[MutationTypes.SET_CONFIGURATION](state: State, config: DynmapServerConfig) {
		state.configuration = Object.assign(state.configuration, config);
		state.configurationHash = config.hash;
	},

	// Sets configuration hash
	[MutationTypes.SET_CONFIGURATION_HASH](state: State, hash: number) {
		state.configurationHash = hash;
	},

	// Sets configuration hash
	[MutationTypes.CLEAR_CONFIGURATION_HASH](state: State) {
		state.configurationHash = undefined;
	},

	//Set messsages from the initial config fetch
	[MutationTypes.SET_MESSAGES](state: State, messages: LiveAtlasMessageConfig) {
		state.messages = Object.assign(state.messages, messages);
	},

	//Sets the list of worlds, and their settings, from the initial config fetch
	[MutationTypes.SET_WORLDS](state: State, worlds: Array<LiveAtlasWorld>) {
		state.worlds.clear();
		state.maps.clear();

		state.followTarget = undefined;
		state.panTarget = undefined;

		state.currentWorldState.timeOfDay = 0;
		state.currentWorldState.raining = false;
		state.currentWorldState.thundering = false;

		worlds.forEach(world => {
			state.worlds.set(world.name, world);
			world.maps.forEach(map => state.maps.set([world.name, map.name].join('_'), map));
		});

		//Update current world if a world with the same name still exists, otherwise clear
		if(state.currentWorld && state.worlds.has(state.currentWorld.name)) {
			state.currentWorld = state.worlds.get(state.currentWorld.name);
		} else {
			state.currentWorld = undefined;
		}

		//Update current map if a map with the same name still exists, otherwise clear
		if(state.currentWorld && state.currentMap && state.maps.has([state.currentWorld.name, state.currentMap.name].join('_'))) {
			state.currentMap = state.maps.get([state.currentWorld.name, state.currentMap.name].join('_'));
		} else {
			state.currentMap = undefined;
		}
	},

	[MutationTypes.CLEAR_WORLDS](state: State) {
		state.worlds.clear();
		state.maps.clear();

		state.followTarget = undefined;
		state.panTarget = undefined;

		state.currentWorldState.timeOfDay = 0;
		state.currentWorldState.raining = false;
		state.currentWorldState.thundering = false;
	},

	//Sets the state and settings of optional components, from the initial config fetch
	[MutationTypes.SET_COMPONENTS](state: State, components: DynmapComponentConfig) {
		state.components = Object.assign(state.components, components);
	},

	//Sets the existing marker sets from the last marker fetch
	[MutationTypes.SET_MARKER_SETS](state: State, markerSets: Map<string, DynmapMarkerSet>) {
		state.markerSets.clear();
		state.pendingSetUpdates.clear();

		for(const entry of markerSets) {
			state.markerSets.set(entry[0], entry[1]);
			state.pendingSetUpdates.set(entry[0], {
				markerUpdates: [],
				areaUpdates: [],
				circleUpdates: [],
				lineUpdates: [],
			});
		}
	},

	[MutationTypes.CLEAR_MARKER_SETS](state: State) {
		state.markerSets.clear();
		state.pendingSetUpdates.clear();
	},

	[MutationTypes.ADD_WORLD](state: State, world: LiveAtlasWorld) {
		state.worlds.set(world.name, world);
	},

	//Sets the current world state an update fetch
	[MutationTypes.SET_WORLD_STATE](state: State, worldState: LiveAtlasWorldState) {
		state.currentWorldState = Object.assign(state.currentWorldState, worldState);
	},

	//Sets the timestamp of the last update fetch
	[MutationTypes.SET_UPDATE_TIMESTAMP](state: State, timestamp: Date) {
		state.updateTimestamp = timestamp;
	},

	//Adds markerset related updates from an update fetch to the pending updates list
	[MutationTypes.ADD_MARKER_SET_UPDATES](state: State, updates: Map<string, DynmapMarkerSetUpdates>) {
		for(const entry of updates) {
			if(!state.markerSets.has(entry[0])) {

				//Create marker set if it doesn't exist
				if(entry[1].payload) {
					state.markerSets.set(entry[0], {
						id: entry[0],
						showLabels: entry[1].payload.showLabels,
						minZoom: entry[1].payload.minZoom,
						maxZoom: entry[1].payload.maxZoom,
						priority: entry[1].payload.priority,
						label: entry[1].payload.label,
						hidden: entry[1].payload.hidden,
						markers: Object.freeze(new Map()) as Map<string, DynmapMarker>,
						areas: Object.freeze(new Map()) as Map<string, DynmapArea>,
						circles: Object.freeze(new Map()) as Map<string, DynmapCircle>,
						lines: Object.freeze(new Map()) as Map<string, DynmapLine>,
					});

					state.pendingSetUpdates.set(entry[0], {
						markerUpdates: [],
						areaUpdates: [],
						circleUpdates: [],
						lineUpdates: [],
					});
				} else {
					console.warn(`ADD_MARKER_SET_UPDATES: Marker set ${entry[0]} doesn't exist`);
					continue;
				}
			}

			const set = state.markerSets.get(entry[0]) as DynmapMarkerSet,
				setUpdates = state.pendingSetUpdates.get(entry[0]) as DynmapMarkerSetUpdates;

			//Delete the set if it has been deleted
			if(entry[1].removed) {
				state.markerSets.delete(entry[0]);
				state.pendingSetUpdates.delete(entry[0]);
				continue;
			}

			//Update the set itself if a payload exists
			if(entry[1].payload) {
				set.showLabels = entry[1].payload.showLabels;
				set.minZoom = entry[1].payload.minZoom;
				set.maxZoom = entry[1].payload.maxZoom;
				set.priority = entry[1].payload.priority;
				set.label = entry[1].payload.label;
				set.hidden = entry[1].payload.hidden;
			}

			//Update non-reactive lists
			for(const update of entry[1].markerUpdates) {
				if(update.removed) {
					set.markers.delete(update.id);
				} else {
					set.markers.set(update.id, update.payload as DynmapMarker);
				}
			}

			for(const update of entry[1].areaUpdates) {
				if(update.removed) {
					set.areas.delete(update.id);
				} else {
					set.areas.set(update.id, update.payload as DynmapArea);
				}
			}

			for(const update of entry[1].circleUpdates) {
				if(update.removed) {
					set.circles.delete(update.id);
				} else {
					set.circles.set(update.id, update.payload as DynmapCircle);
				}
			}

			for(const update of entry[1].lineUpdates) {
				if(update.removed) {
					set.lines.delete(update.id);
				} else {
					set.lines.set(update.id, update.payload as DynmapLine);
				}
			}

			//Add to reactive pending updates lists
			setUpdates.markerUpdates = setUpdates.markerUpdates.concat(entry[1].markerUpdates);
			setUpdates.areaUpdates = setUpdates.areaUpdates.concat(entry[1].areaUpdates);
			setUpdates.circleUpdates = setUpdates.circleUpdates.concat(entry[1].circleUpdates);
			setUpdates.lineUpdates = setUpdates.lineUpdates.concat(entry[1].lineUpdates);
		}
	},

	//Adds tile updates from an update fetch to the pending updates list
	[MutationTypes.ADD_TILE_UPDATES](state: State, updates: Array<DynmapTileUpdate>) {
		state.pendingTileUpdates = state.pendingTileUpdates.concat(updates);
	},

	//Adds chat messages from an update fetch to the chat history
	[MutationTypes.ADD_CHAT](state: State, chat: Array<DynmapChat>) {
		state.chat.messages.unshift(...chat);
	},

	//Pops the specified number of marker updates from the pending updates list
	[MutationTypes.POP_MARKER_UPDATES](state: State, {markerSet, amount}) {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_MARKER_UPDATES: Marker set ${markerSet} doesn't exist`);
			return;
		}

		state.pendingSetUpdates.get(markerSet)!.markerUpdates.splice(0, amount);
	},

	//Pops the specified number of area updates from the pending updates list
	[MutationTypes.POP_AREA_UPDATES](state: State, {markerSet, amount}) {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_AREA_UPDATES: Marker set ${markerSet} doesn't exist`);
			return;
		}

		state.pendingSetUpdates.get(markerSet)!.areaUpdates.splice(0, amount);
	},

	//Pops the specified number of circle updates from the pending updates list
	[MutationTypes.POP_CIRCLE_UPDATES](state: State, {markerSet, amount}) {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_CIRCLE_UPDATES: Marker set ${markerSet} doesn't exist`);
			return;
		}

		state.pendingSetUpdates.get(markerSet)!.circleUpdates.splice(0, amount);
	},

	//Pops the specified number of line updates from the pending updates list
	[MutationTypes.POP_LINE_UPDATES](state: State, {markerSet, amount})  {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_LINE_UPDATES: Marker set ${markerSet} doesn't exist`);
			return;
		}

		state.pendingSetUpdates.get(markerSet)!.lineUpdates.splice(0, amount);
	},

	//Pops the specified number of tile updates from the pending updates list
	[MutationTypes.POP_TILE_UPDATES](state: State, amount: number) {
		state.pendingTileUpdates.splice(0, amount);
	},

	//Increments the request id for the next update fetch
	[MutationTypes.INCREMENT_REQUEST_ID](state: State) {
		state.updateRequestId++;
	},

	// Set up to 10 players at once
	[MutationTypes.SET_PLAYERS_ASYNC](state: State, players: Set<DynmapPlayer>): Set<DynmapPlayer> {
		let count = 0;

		for(const player of players) {
			if(state.players.has(player.account)) {
				const existing = state.players.get(player.account);

				existing!.health = player.health;
				existing!.armor = player.armor;
				existing!.location = Object.assign(existing!.location, player.location);
				existing!.hidden = player.hidden;
				existing!.name = player.name;
				existing!.sort = player.sort;

				if(existing!.name !== player.name || existing!.sort !== player.sort) {
					state.sortedPlayers.dirty = true;
				}
			} else {
				state.sortedPlayers.dirty = true;
				state.players.set(player.account, {
					account: player.account,
					health: player.health,
					armor: player.armor,
					location: player.location,
					name: player.name,
					sort: player.sort,
					hidden: player.hidden,
				});
			}

			players.delete(player);

			if(++count >= 10) {
				break;
			}
		}

		//Re-sort sortedPlayers array if needed
		if(!players.size && state.sortedPlayers.dirty) {
			state.sortedPlayers = [...state.players.values()].sort((a, b) => {
				if(a.sort !== b.sort) {
					return a.sort - b.sort;
				}

				return a.account.toLowerCase().localeCompare(b.account.toLowerCase());
			}) as LiveAtlasSortedPlayers;
		}

		return players;
	},

	//Removes all players not found in the provided keep set
	[MutationTypes.SYNC_PLAYERS](state: State, keep: Set<string>) {
		for(const [key, player] of state.players) {
			if(!keep.has(player.account)) {
				state.sortedPlayers.splice(state.sortedPlayers.indexOf(player), 1);
				state.players.delete(key);
			}
		}
	},

	//Removes all players not found in the provided keep set
	[MutationTypes.CLEAR_PLAYERS](state: State) {
		state.followTarget = undefined;
		state.panTarget = undefined;
		state.players.clear();
		state.sortedPlayers.splice(0, state.sortedPlayers.length);
	},

	//Sets the currently active server
	[MutationTypes.SET_CURRENT_SERVER](state: State, serverName) {
		if(!state.servers.has(serverName)) {
			throw new RangeError(`Unknown server ${serverName}`);
		}

		state.currentServer = state.servers.get(serverName);
	},

	//Sets the currently active map/world
	[MutationTypes.SET_CURRENT_MAP](state: State, {worldName, mapName, realWorldName}) {
		const originalMapName = mapName;
		mapName = [worldName, mapName].join('_');
		console.log(`${mapName}`);

		console.log(Array.from(state.worlds.entries()));
		if(!state.worlds.has(worldName)) {
			throw new RangeError(`Unknown world ${worldName}`);
		}
		if(!state.worlds.has(realWorldName)) {
			throw new RangeError(`Unknown real world ${realWorldName}`);
		}
		const newWorld = state.worlds.get(worldName)!;
		const newRealWorld = state.worlds.get(realWorldName)!;

		console.log(Array.from(newWorld.maps.entries()));
		if(!newWorld.maps.has(originalMapName)) {
			throw new RangeError(`Unknown map ${originalMapName}`);
		}

		if(state.currentWorld !== newRealWorld) {
			state.currentWorld = newRealWorld;
			state.markerSets.clear();
			state.pendingSetUpdates.clear();
			state.pendingTileUpdates = [];
		}
		state.currentMap = newWorld.maps.get(originalMapName);
	},

	//Sets the projection to use for coordinate conversion in the current map
	[MutationTypes.SET_CURRENT_PROJECTION](state: State, projection) {
		state.currentProjection = projection;
	},

	//Sets the current location the map is showing. This is called by the map itself, and calling elsewhere will not update the map.
	[MutationTypes.SET_CURRENT_LOCATION](state: State, payload: Coordinate) {
		state.currentLocation = payload;
	},

	//Sets the current zoom level of the map. This is called by the map itself, and calling elsewhere will not update the map.
	[MutationTypes.SET_CURRENT_ZOOM](state: State, payload: number) {
		state.currentZoom = payload;
	},

	//Sets the result of parsing the current map url, if present and valid
	[MutationTypes.SET_PARSED_URL](state: State, payload: LiveAtlasParsedUrl) {
		state.parsedUrl = payload;
	},

	//Clear the current map/world
	[MutationTypes.CLEAR_CURRENT_MAP](state: State) {
		state.markerSets.clear();
		state.pendingSetUpdates.clear();
		state.pendingTileUpdates = [];

		state.currentWorld = undefined;
		state.currentMap = undefined;
	},

	//Clear any existing parsed url
	[MutationTypes.CLEAR_PARSED_URL](state: State) {
		state.parsedUrl = undefined;
	},

	//Set the follow target, which the map will automatically pan to keep in view
	[MutationTypes.SET_FOLLOW_TARGET](state: State, player: DynmapPlayer) {
		state.followTarget = player;
	},

	//Set the pan target, which the map will immediately pan to once
	[MutationTypes.SET_PAN_TARGET](state: State, player: DynmapPlayer) {
		state.panTarget = player;
	},

	//Clear the follow target
	[MutationTypes.CLEAR_FOLLOW_TARGET](state: State) {
		state.followTarget = undefined;
	},

	//Clear the pan target
	[MutationTypes.CLEAR_PAN_TARGET](state: State) {
		state.panTarget = undefined;
	},

	[MutationTypes.SET_SMALL_SCREEN](state: State, smallScreen: boolean): void {
		if(!state.ui.smallScreen && smallScreen && state.ui.visibleElements.size > 1) {
			state.ui.visibleElements.clear();
		}

		state.ui.smallScreen = smallScreen;
	},

	[MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY](state: State, element: LiveAtlasUIElement): void {
		const newState = !state.ui.visibleElements.has(element);

		if(newState && state.ui.smallScreen) {
			state.ui.visibleElements.clear();
		}

		state.ui.previouslyVisibleElements.add(element);
		newState ? state.ui.visibleElements.add(element) : state.ui.visibleElements.delete(element);
	},

	[MutationTypes.SET_UI_ELEMENT_VISIBILITY](state: State, payload: {element: LiveAtlasUIElement, state: boolean}): void {
		if(payload.state && state.ui.smallScreen) {
			state.ui.visibleElements.clear();
		}

		if(payload.state || state.ui.visibleElements.has(payload.element)) {
			state.ui.previouslyVisibleElements.add(payload.element);
		}

		payload.state ? state.ui.visibleElements.add(payload.element) : state.ui.visibleElements.delete(payload.element);
	},

	[MutationTypes.TOGGLE_SIDEBAR_SECTION_COLLAPSED_STATE](state: State, section: LiveAtlasSidebarSection): void {
		if(state.ui.sidebar.collapsedSections.has(section)) {
			state.ui.sidebar.collapsedSections.delete(section);
		} else {
			state.ui.sidebar.collapsedSections.add(section);
		}
	},

	[MutationTypes.SET_SIDEBAR_SECTION_COLLAPSED_STATE](state: State, payload: {section: LiveAtlasSidebarSection, state: boolean}): void {
		if (payload.state) {
			state.ui.sidebar.collapsedSections.delete(payload.section);
		} else {
			state.ui.sidebar.collapsedSections.add(payload.section);
		}
	},

	[MutationTypes.SET_LOGGED_IN](state: State, payload: boolean): void {
		state.loggedIn = payload;
	}
}
