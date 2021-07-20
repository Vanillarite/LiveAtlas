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

import {
	DynmapArea,
	DynmapChat,
	DynmapCircle,
	DynmapComponentConfig,
	DynmapConfigurationResponse,
	DynmapLine,
	DynmapMarker,
	DynmapMarkerSet,
	DynmapMarkerSetUpdates,
	DynmapPlayer,
	DynmapServerConfig,
	DynmapTileUpdate,
	DynmapUpdate,
	DynmapUpdateResponse,
	DynmapUpdates
} from "@/dynmap";
import {useStore} from "@/store";
import ChatError from "@/errors/ChatError";
import {LiveAtlasMessageConfig, LiveAtlasWorld} from "@/index";

const titleColours = /§[0-9a-f]/ig;

function buildServerConfig(response: any): DynmapServerConfig {
	return {
		version: response.dynmapversion || '',
		grayHiddenPlayers: response.grayplayerswhenhidden || false,
		defaultMap: response.defaultmap || undefined,
		defaultWorld: response.defaultworld || undefined,
		defaultZoom: response.defaultzoom || 0,
		followMap: response.followmap || undefined,
		followZoom: response.followzoom || 0,
		updateInterval: response.updaterate || 3000,
		showLayerControl: response.showlayercontrol && response.showlayercontrol !== 'false', //Sent as a string for some reason
		title: response.title.replace(titleColours, '') || 'Dynmap',
		loginEnabled: response['login-enabled'] || false,
		maxPlayers: response.maxcount || 0,
		expandUI: response.sidebaropened && response.sidebaropened !== 'false', //Sent as a string for some reason
		hash: response.confighash || 0,
	};
}

function buildMessagesConfig(response: any): LiveAtlasMessageConfig {
	const liveAtlasMessages = window.liveAtlasConfig ? window.liveAtlasConfig.messages || {} : {};

	return {
		chatPlayerJoin: response.joinmessage || '',
		chatPlayerQuit: response.quitmessage || '',
		chatAnonymousJoin: response['msg-hiddennamejoin'] || '',
		chatAnonymousQuit: response['msg-hiddennamequit'] || '',
		chatTitle: liveAtlasMessages.chatTitle || '',
		chatLogin: liveAtlasMessages.chatLogin || '',
		chatLoginLink: liveAtlasMessages.chatLoginLink || '',
		chatNoMessages: liveAtlasMessages.chatNoMessages || '',
		chatSend: liveAtlasMessages.chatSend || '',
		chatPlaceholder: liveAtlasMessages.chatPlaceholder || '',
		chatErrorNotAllowed: response['msg-chatnotallowed'] || '',
		chatErrorRequiresLogin: response['msg-chatrequireslogin'] || '',
		chatErrorCooldown: response.spammessage || '',
		chatErrorDisabled: liveAtlasMessages.chatErrorDisabled || '',
		chatErrorUnknown: liveAtlasMessages.chatErrorUnknown || '',
		serversHeading: liveAtlasMessages.serversHeading || '',
		worldsHeading: response['msg-maptypes'] || '',
		worldsSkeleton: liveAtlasMessages.worldsSkeleton || '',
		playersHeading: response['msg-players'] || '',
		playersSkeleton: liveAtlasMessages.playersSkeleton || '',
		playersTitle: liveAtlasMessages.playersTitle || '',
		playersTitleHidden: liveAtlasMessages.playersTitleHidden || '',
		playersTitleOtherWorld: liveAtlasMessages.playersTitleOtherWorld || '',
		followingHeading: liveAtlasMessages.followingHeading || '',
		followingHidden: liveAtlasMessages.followingHidden || '',
		followingUnfollow: liveAtlasMessages.followingUnfollow || '',
		followingTitleUnfollow: liveAtlasMessages.followingTitleUnfollow || '',
		linkTitle: liveAtlasMessages.linkTitle || '',
		loadingTitle: liveAtlasMessages.loadingTitle || '',
		locationRegion: liveAtlasMessages.locationRegion || '',
		locationChunk: liveAtlasMessages.locationChunk || '',
		contextMenuCopyLink: liveAtlasMessages.contextMenuCopyLink || '',
		contextMenuCenterHere: liveAtlasMessages.contextMenuCenterHere || '',
		toggleTitle: liveAtlasMessages.toggleTitle || '',
		mapTitle: liveAtlasMessages.mapTitle || '',
		layersTitle: liveAtlasMessages.layersTitle || '',
		copyToClipboardSuccess: liveAtlasMessages.copyToClipboardSuccess || '',
		copyToClipboardError: liveAtlasMessages.copyToClipboardError || '',
	}
}

function buildWorlds(response: any): Array<LiveAtlasWorld> {
	const worlds: Map<string, LiveAtlasWorld> = new Map<string, LiveAtlasWorld>();

	//Get all the worlds first so we can handle append_to_world properly
	(response.worlds || []).forEach((world: any) => {
		worlds.set(world.name, {
			seaLevel: world.sealevel || 64,
			name: world.name,
			protected: world.protected || false,
			title: world.title || '',
			height: world.height || 256,
			center: {
				x: world.center.x || 0,
				y: world.center.y || 0,
				z: world.center.z || 0
			},
			maps: new Map(),
		});
	});

	(response.worlds || []).forEach((world: any) => {
		(world.maps || []).forEach((map: any) => {
			const worldName = map.append_to_world || world.name,
				w = worlds.get(worldName);

			if(!w) {
				console.warn(`Ignoring map '${map.name}' associated with non-existant world '${worldName}'`);
				return;
			}
			let mapName = map.name;
			if (w.maps.has(mapName)) {
				mapName = `${map.name}__${world.name}`;
			}

			w.maps.set(mapName, {
				world: world, //Ignore append_to_world here otherwise things break
				appendToWorld: w,
				background: map.background || '#000000',
				backgroundDay: map.backgroundday || '#000000',
				backgroundNight: map.backgroundnight || '#000000',
				icon: map.icon || undefined,
				imageFormat: map['image-format'] || 'png',
				name: mapName || '(Unnamed map)',
				nightAndDay: map.nightandday || false,
				prefix: map.prefix || '',
				protected: map.protected || false,
				title: map.title || '',
				mapToWorld: map.maptoworld || [0, 0, 0, 0, 0, 0, 0, 0, 0],
				worldToMap: map.worldtomap || [0, 0, 0, 0, 0, 0, 0, 0, 0],
				nativeZoomLevels: map.mapzoomout || 1,
				extraZoomLevels: map.mapzoomin || 0,
			});
		});
	});

	return Array.from(worlds.values());
}

function buildComponents(response: any): DynmapComponentConfig {
	const components: DynmapComponentConfig = {
		markers: {
			showLabels: false,
		},
		chatBox: undefined,
		chatBalloons: false,
		playerMarkers: undefined,
		coordinatesControl: undefined,
		linkControl: false,
		clockControl: undefined,
		logoControls: [],
	};

	(response.components || []).forEach((component: any) => {
		const type = component.type || "unknown";

		switch (type) {
			case "markers":
				components.markers = {
					showLabels: component.showlabel || false,
				}

				break;

			case "playermarkers":
				components.playerMarkers = {
					hideByDefault: component.hidebydefault || false,
					layerName: component.label || "Players",
					layerPriority: component.layerprio || 0,
					showBodies: component.showplayerbody || false,
					showSkinFaces: component.showplayerfaces || false,
					showHealth: component.showplayerhealth || false,
					smallFaces: component.smallplayerfaces || false,
				}

				break;

			case "coord":
				components.coordinatesControl = {
					showY: !(component.hidey || false),
					label: component.label || "Location: ",
					showRegion: component['show-mcr'] || false,
					showChunk: component['show-chunk'] || false,
				}

				break;

			case "link":
				components.linkControl = true;

				break;

			case "digitalclock":
				components.clockControl = {
					showDigitalClock: true,
					showWeather: false,
					showTimeOfDay: false,
				}
				break;

			case "timeofdayclock":
				components.clockControl = {
					showTimeOfDay: true,
					showDigitalClock: component.showdigitalclock || false,
					showWeather: component.showweather || false,
				}
				break;

			case "logo":
				components.logoControls.push({
					text: component.text || '',
					url: component.linkurl || undefined,
					position: component.position.replace('-', '') || 'topleft',
					image: component.logourl || undefined,
				});
				break;

			case "chat":
				if (response.allowwebchat) {
					components.chatSending = {
						loginRequired: response['webchat-requires-login'] || false,
						maxLength: response['chatlengthlimit'] || 256,
						cooldown: response['webchat-interval'] || 5,
					}
				}
				break;

			case "chatbox":
				components.chatBox = {
					allowUrlName: component.allowurlname || false,
					showPlayerFaces: component.showplayerfaces || false,
					messageLifetime: component.messagettl || Infinity,
					messageHistory: component.scrollback || Infinity,
				}
				break;

			case "chatballoon":
				components.chatBalloons = true;
		}
	});

	return components;
}

function buildMarkerSet(id: string, data: any): any {
	return {
		id,
		label: data.label || "Unnamed set",
		hidden: data.hide || false,
		priority: data.layerprio || 0,
		showLabels: data.showlabels || undefined,
		minZoom: typeof data.minzoom !== 'undefined' && data.minzoom > -1 ? data.minzoom : undefined,
		maxZoom: typeof data.maxzoom !== 'undefined' && data.maxzoom > -1 ? data.maxzoom : undefined,
	}
}

function buildMarkers(data: any): Map<string, DynmapMarker> {
	const markers = Object.freeze(new Map()) as Map<string, DynmapMarker>;

	for (const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		markers.set(key, buildMarker(data[key]));
	}

	return markers;
}

function buildMarker(marker: any): DynmapMarker {
	return {
		label: marker.label || '',
		location: {
			x: marker.x || 0,
			y: marker.y || 0,
			z: marker.z || 0,
		},
		dimensions: [16, 16],
		icon: marker.icon || "default",
		isHTML: marker.markup || false,
		minZoom: typeof marker.minzoom !== 'undefined' && marker.minzoom > -1 ? marker.minzoom : undefined,
		maxZoom: typeof marker.maxzoom !== 'undefined' && marker.maxzoom > -1 ? marker.maxzoom : undefined,
		popupContent: marker.desc || undefined,
	};
}

function buildAreas(data: any): Map<string, DynmapArea> {
	const areas = Object.freeze(new Map()) as Map<string, DynmapArea>;

	for (const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		areas.set(key, buildArea(data[key]));
	}

	return areas;
}

function buildArea(area: any): DynmapArea {
	return {
		style: {
			color: area.color || '#ff0000',
			opacity: area.opacity || 1,
			weight: area.weight || 1,
			fillColor: area.fillcolor || '#ff0000',
			fillOpacity: area.fillopacity || 0,
		},
		label: area.label || '',
		isHTML: area.markup || false,
		x: area.x || [0, 0],
		y: [area.ybottom || 0, area.ytop || 0],
		z: area.z || [0, 0],
		minZoom: typeof area.minzoom !== 'undefined' && area.minzoom > -1 ? area.minzoom : undefined,
		maxZoom: typeof area.maxzoom !== 'undefined' && area.maxzoom > -1 ? area.maxzoom : undefined,
		popupContent: area.desc || undefined,
	};
}

function buildLines(data: any): Map<string, DynmapLine> {
	const lines = Object.freeze(new Map()) as Map<string, DynmapLine>;

	for (const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		lines.set(key, buildLine(data[key]));
	}

	return lines;
}

function buildLine(line: any): DynmapLine {
	return {
		x: line.x || [0, 0],
		y: line.y || [0, 0],
		z: line.z || [0, 0],
		style: {
			color: line.color || '#ff0000',
			opacity: line.opacity || 1,
			weight: line.weight || 1,
		},
		label: line.label || '',
		isHTML: line.markup || false,
		minZoom: typeof line.minzoom !== 'undefined' && line.minzoom > -1 ? line.minzoom : undefined,
		maxZoom: typeof line.maxzoom !== 'undefined' && line.maxzoom > -1 ? line.maxzoom : undefined,
		popupContent: line.desc || undefined,
	};
}

function buildCircles(data: any): Map<string, DynmapCircle> {
	const circles = Object.freeze(new Map()) as Map<string, DynmapCircle>;

	for (const key in data) {
		if (!Object.prototype.hasOwnProperty.call(data, key)) {
			continue;
		}

		circles.set(key, buildCircle(data[key]));
	}

	return circles;
}

function buildCircle(circle: any): DynmapCircle {
	return {
		location: {
			x: circle.x || 0,
			y: circle.y || 0,
			z: circle.z || 0,
		},
		radius: [circle.xr || 0, circle.zr || 0],
		style: {
			fillColor: circle.fillcolor || '#ff0000',
			fillOpacity: circle.fillopacity || 0,
			color: circle.color || '#ff0000',
			opacity: circle.opacity || 1,
			weight: circle.weight || 1,
		},
		label: circle.label || '',
		isHTML: circle.markup || false,

		minZoom: typeof circle.minzoom !== 'undefined' && circle.minzoom > -1 ? circle.minzoom : undefined,
		maxZoom: typeof circle.maxzoom !== 'undefined' && circle.maxzoom > -1 ? circle.maxzoom : undefined,
		popupContent: circle.desc || undefined,
	};
}

function buildUpdates(data: Array<any>): DynmapUpdates {
	const updates = {
			markerSets: new Map<string, DynmapMarkerSetUpdates>(),
			tiles: [] as DynmapTileUpdate[],
			chat: [] as DynmapChat[],
		},
		dropped = {
			stale: 0,
			noSet: 0,
			noId: 0,
			unknownType: 0,
			unknownCType: 0,
			incomplete: 0,
			notImplemented: 0,
		},
		lastUpdate = useStore().state.updateTimestamp;

	let accepted = 0;

	for (const entry of data) {
		switch (entry.type) {
			case 'component': {
				if (lastUpdate && entry.timestamp < lastUpdate) {
					dropped.stale++;
					continue;
				}

				if (!entry.id) {
					dropped.noId++;
					continue;
				}

				//Set updates don't have a set field, the id is the set
				const set = entry.msg.startsWith("set") ? entry.id : entry.set;

				if (!set) {
					dropped.noSet++;
					continue;
				}

				if (entry.ctype !== 'markers') {
					dropped.unknownCType++;
					continue;
				}

				if (!updates.markerSets.has(set)) {
					updates.markerSets.set(set, {
						areaUpdates: [],
						markerUpdates: [],
						lineUpdates: [],
						circleUpdates: [],
						removed: false,
					});
				}

				const markerSetUpdates = updates.markerSets.get(set),
					update: DynmapUpdate = {
						id: entry.id,
						removed: entry.msg.endsWith('deleted'),
					};

				if (entry.msg.startsWith("set")) {
					markerSetUpdates!.removed = update.removed;
					markerSetUpdates!.payload = update.removed ? undefined : buildMarkerSet(set, entry);
				} else if (entry.msg.startsWith("marker")) {
					update.payload = update.removed ? undefined : buildMarker(entry);
					markerSetUpdates!.markerUpdates.push(Object.freeze(update));
				} else if (entry.msg.startsWith("area")) {
					update.payload = update.removed ? undefined : buildArea(entry);
					markerSetUpdates!.areaUpdates.push(Object.freeze(update));

				} else if (entry.msg.startsWith("circle")) {
					update.payload = update.removed ? undefined : buildCircle(entry);
					markerSetUpdates!.circleUpdates.push(Object.freeze(update));

				} else if (entry.msg.startsWith("line")) {
					update.payload = update.removed ? undefined : buildLine(entry);
					markerSetUpdates!.lineUpdates.push(Object.freeze(update));
				}

				accepted++;

				break;
			}

			case 'chat':
				if (!entry.message || !entry.timestamp) {
					dropped.incomplete++;
					continue;
				}

				if (entry.timestamp < lastUpdate) {
					dropped.stale++;
					continue;
				}

				if (entry.source !== 'player' && entry.source !== 'web') {
					dropped.notImplemented++;
					continue;
				}

				updates.chat.push({
					type: 'chat',
					source: entry.source || undefined,
					playerAccount: entry.account || undefined,
					playerName: entry.playerName || undefined,
					message: entry.message || "",
					timestamp: entry.timestamp,
					channel: entry.channel || undefined,
				});
				break;

			case 'playerjoin':
				if (!entry.account || !entry.timestamp) {
					dropped.incomplete++;
					continue;
				}

				if (entry.timestamp < lastUpdate) {
					dropped.stale++;
					continue;
				}

				updates.chat.push({
					type: 'playerjoin',
					playerAccount: entry.account,
					playerName: entry.playerName || "",
					timestamp: entry.timestamp || undefined,
				});
				break;

			case 'playerquit':
				if (!entry.account || !entry.timestamp) {
					dropped.incomplete++;
					continue;
				}

				if (entry.timestamp < lastUpdate) {
					dropped.stale++;
					continue;
				}

				updates.chat.push({
					type: 'playerleave',
					playerAccount: entry.account,
					playerName: entry.playerName || "",
					timestamp: entry.timestamp || undefined,
				});
				break;

			case 'tile':
				if (!entry.name || !entry.timestamp) {
					dropped.incomplete++;
					continue;
				}

				if (lastUpdate && entry.timestamp < lastUpdate) {
					dropped.stale++;
					continue;
				}

				updates.tiles.push({
					name: entry.name,
					timestamp: entry.timestamp,
				});

				accepted++;
				break;

			default:
				dropped.unknownType++;
		}
	}

	//Sort chat by newest first
	updates.chat = updates.chat.sort((one, two) => {
		return two.timestamp - one.timestamp;
	});

	console.debug(`Updates: ${accepted} accepted. Rejected: `, dropped);

	return updates;
}

async function fetchJSON(url: string, signal: AbortSignal) {
	let response, json;

	try {
		response = await fetch(url, {signal});
	} catch(e) {
		if(e instanceof DOMException && e.name === 'AbortError') {
			console.warn(`Request aborted (${url}`);
			throw e;
		} else {
			console.error(e);
		}

		throw new Error(`Network request failed`);
	}

	if (!response.ok) {
		throw new Error(`Network request failed (${response.statusText || 'Unknown'})`);
	}

	try {
		json = await response.json();
	} catch(e) {
		if(e instanceof DOMException && e.name === 'AbortError') {
			console.warn(`Request aborted (${url}`);
			throw e;
		} else {
			throw new Error('Request returned invalid json');
		}
	}

	return json;
}

let configurationAbort: AbortController | undefined = undefined,
	markersAbort: AbortController | undefined = undefined,
	updateAbort: AbortController | undefined = undefined;

export default {
	async getConfiguration(): Promise<DynmapConfigurationResponse> {
		if(configurationAbort) {
			configurationAbort.abort();
		}

		configurationAbort = new AbortController();

		const response = await fetchJSON(useStore().getters.serverConfig.dynmap.configuration, configurationAbort.signal);

		if (response.error === 'login-required') {
			throw new Error("Login required");
		} else if (response.error) {
			throw new Error(response.error);
		}

		return {
			config: buildServerConfig(response),
			messages: buildMessagesConfig(response),
			worlds: buildWorlds(response),
			components: buildComponents(response),
			loggedIn: response.loggedin || false,
		}
	},

	async getUpdate(requestId: number, world: string, timestamp: number): Promise<DynmapUpdateResponse> {
		let url = useStore().getters.serverConfig.dynmap.update;
		url = url.replace('{world}', world);
		url = url.replace('{timestamp}', timestamp.toString());

		if(updateAbort) {
			updateAbort.abort();
		}

		updateAbort = new AbortController();

		const response = await fetchJSON(url, updateAbort.signal);
		const players: Set<DynmapPlayer> = new Set();

		(response.players || []).forEach((player: any) => {
			const world = player.world && player.world !== '-some-other-bogus-world-' ? player.world : undefined;

			players.add({
				account: player.account || "",
				health: player.health || 0,
				armor: player.armor || 0,
				name: player.name || "",
				sort: player.sort || 0,
				hidden: !world,
				location: {
					//Add 0.5 to position in the middle of a block
					x: !isNaN(player.x) ? player.x + 0.5 : 0,
					y: !isNaN(player.y) ? player.y : 0,
					z: !isNaN(player.z) ? player.z + 0.5 : 0,
					world: world,
				}
			});
		});

		//Extra fake players for testing
		// for(let i = 0; i < 450; i++) {
		// 	players.add({
		// 		account: "VIDEO GAMES " + i,
		// 		health: Math.round(Math.random() * 10),
		// 		armor: Math.round(Math.random() * 10),
		// 		name: "VIDEO GAMES " + i,
		// 		sort: Math.round(Math.random() * 10),
		// 		hidden: false,
		// 		location: {
		// 			x: Math.round(Math.random() * 1000) - 500,
		// 			y: 64,
		// 			z: Math.round(Math.random() * 1000) - 500,
		// 			world: "world",
		// 		}
		// 	});
		// }

		return {
			worldState: {
				timeOfDay: response.servertime || 0,
				thundering: response.isThundering || false,
				raining: response.hasStorm || false,
			},
			playerCount: response.count || 0,
			configHash: response.confighash || 0,
			timestamp: response.timestamp || 0,
			players,
			updates: buildUpdates(response.updates || []),
		}
	},

	async getMarkerSets(world: string): Promise<Map<string, DynmapMarkerSet>> {
		const url = `${useStore().getters.serverConfig.dynmap.markers}_markers_/marker_${world}.json`;

		if(markersAbort) {
			markersAbort.abort();
		}

		markersAbort = new AbortController();

		const response = await fetchJSON(url, markersAbort.signal);
		const sets: Map<string, DynmapMarkerSet> = new Map();

		response.sets = response.sets || {};

		for (const key in response.sets) {
			if (!Object.prototype.hasOwnProperty.call(response.sets, key)) {
				continue;
			}

			const set = response.sets[key],
				markers = buildMarkers(set.markers || {}),
				circles = buildCircles(set.circles || {}),
				areas = buildAreas(set.areas || {}),
				lines = buildLines(set.lines || {});

			sets.set(key, {
				...buildMarkerSet(key, set),
				markers,
				circles,
				areas,
				lines,
			});
		}

		return sets;
	},

	sendChatMessage(message: string) {
		const store = useStore();

		if (!store.state.components.chatSending) {
			return Promise.reject(store.state.messages.chatErrorDisabled);
		}

		return fetch(useStore().getters.serverConfig.dynmap.sendmessage, {
			method: 'POST',
			body: JSON.stringify({
				name: null,
				message: message,
			})
		}).then((response) => {
			if (response.status === 403) { //Rate limited
				throw new ChatError(store.state.messages.chatErrorCooldown
					.replace('%interval%', store.state.components.chatSending!.cooldown.toString()));
			}

			if (!response.ok) {
				throw new Error('Network request failed');
			}

			return response.json();
		}).then(response => {
			if (response.error !== 'none') {
				throw new ChatError(store.state.messages.chatErrorNotAllowed);
			}
		}).catch(e => {
			if (!(e instanceof ChatError)) {
				console.error(store.state.messages.chatErrorUnknown);
				console.trace(e);
			}

			throw e;
		});
	}
}
