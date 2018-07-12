import leaflet from 'leaflet';

// have to import these before the css because of a parcel bug
// https://github.com/parcel-bundler/parcel/issues/879#issuecomment-403263287
import markerIcon from '../node_modules/leaflet/dist/images/marker-icon.png';
import markerIcon2x from '../node_modules/leaflet/dist/images/marker-icon-2x.png';
import markerShadow from '../node_modules/leaflet/dist/images/marker-shadow.png';
import './styles.css';

console.log(markerIcon, markerIcon2x, markerShadow)
console.log(leaflet)

function checkStatus(response) {
	if (response.status >= 200 && response.status < 300) {
		return response;
	} else {
		const error = new Error(response.statusText);
		error.response = response;
		throw error;
	}
}

function setLoading(huh) {
	document.querySelector('.loading').style.visibility = huh ? 'visible' : 'hidden';
}

const osm = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const map = leaflet.map('map').setView([37.8, -96], 4).addLayer(osm);
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
	setLoading(true);
	group.clearLayers();

	fetch(`users/${username}`)
		.then(checkStatus)
		.then((data) => data.json())
		.then((data) => {
			data.forEach((image) => {
				if (image.has_location && image.location_coords) {
					console.log('has location')
					// for some reason location coordinates are returned as [long, lat]
					leaflet.marker(image.location_coords.reverse(), { icon })
						.addTo(group)
						//.bindPopup(`Date Taken: ${new Date(image.capture_date)}`);
						.bindPopup(`
							<a href="${image.permalink}"><img width="150" src="//${image.responsive_url}?w=150" /></a><br />
							<span style="word-wrap: break-word">Date Taken: ${new Date(image.capture_date)}</span>
						`);
				}
			});
			group.addTo(map);
			setLoading(false);
		})
		.catch((e) => {
			console.log('uh oh', e);
		});
}

const input = document.querySelector('input');
input.onkeyup = function(event) {
	if (event.key === 'Enter') {
		const username = event.target.value;
		username ? loadUser(username) : group.clearLayers();
	}
};
document.querySelector('.actions > .search').onclick = function() {
	const username = input.value;
	username && loadUser(username);
};
document.querySelector('.actions > .reset').onclick = function() {
	group.clearLayers();
	input.value = '';
};
