import leaflet from 'leaflet';
import Modal from './modal.js';

// have to import these before the css because of a parcel bug
// https://github.com/parcel-bundler/parcel/issues/879#issuecomment-403263287
import markerIcon from '../node_modules/leaflet/dist/images/marker-icon.png';
import markerIcon2x from '../node_modules/leaflet/dist/images/marker-icon-2x.png';
import markerShadow from '../node_modules/leaflet/dist/images/marker-shadow.png';
import './styles.css';

const loading = document.querySelector('.loading');
const error = document.querySelector('.error');

console.log(markerIcon, markerIcon2x, markerShadow)
console.log(leaflet)

function checkStatus(response) {
	if (response.ok) {
		return response;
	} else {
		return response.text()
			.then((text) => {
				const error = new Error(text || response.statusText);
				error.response = response;
				throw error;
			});
	}
}

function setLoading(huh) {
	loading.style.display = huh ? 'inline' : 'none';
}

function setError(message) {
  setLoading(false);
  error.innerText = message ? `Uh oh: ${message}. 😳` : null;
  error.style.visibility = message ? 'visible' : 'hidden';
}

const modal = new Modal(document.querySelector('.modal'));

const osm = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const map = leaflet.map('map').addLayer(osm);
resetMap();

const group = new leaflet.LayerGroup();
// can't use default because parcel adds hash to these filenames
const icon = new leaflet.Icon({
	iconUrl:       markerIcon,
	iconRetinaUrl: markerIcon2x,
	shadowUrl:     markerShadow,
	iconSize:      [25, 41],
	iconAnchor:    [12, 41],
	popupAnchor:   [1, -34],
	tooltipAnchor: [16, -28],
	shadowSize:    [41, 41]
});

function loadUser(username) {
	setError(null);
	setLoading(true);
	group.clearLayers();

	const coords = [];

	fetch(`users/${username}`)
		.then(checkStatus)
		.then((data) => data.json())
		.then((data) => {
			data.forEach((image) => {
				if (image.has_location && image.location_coords) {
					// for some reason location coordinates are returned as [long, lat]
					image.location_coords.reverse();
					console.log('has location')
					coords.push(image.location_coords);
					leaflet.marker(image.location_coords, { icon })
						.addTo(group)
						.bindPopup(`
							<a href="${image.permalink}"><img width="200" src="//${image.responsive_url}?w=200" /></a>
							<span>${image.description}</span>
							<span>🕰️ ${new Date(image.capture_date).toLocaleString()}</span>
						`, { closeButton: false });
				}
			});
			group.addTo(map);
			coords.length && map.fitBounds(coords);
			setLoading(false);
		})
		.catch((e) => {
			setError(e.message || e);
			console.log('uh oh', e);
		});
}

function resetMap() {
	const breakpoints = [425, 1440, Infinity];
	const zoom = breakpoints.findIndex((b) => window.innerWidth <= b) + 2;

	group && group.clearLayers();
	map.setView([30, -40], zoom);
}

const input = document.querySelector('input');
input.onkeyup = function(event) {
	if (event.key === 'Enter') {
		const username = event.target.value;
		username ? loadUser(username) : resetMap();
	}
};

document.querySelector('.actions > .search').onclick = function() {
	const username = input.value;
	username && loadUser(username);
};

document.querySelector('.actions > .reset').onclick = function() {
	resetMap();
	input.value = '';
};

document.querySelector('.actions > .wat').onclick = function() {
	modal.open();
};
