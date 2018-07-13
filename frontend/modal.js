export default class Modal {
	constructor(el) {
		this.element = el;
		this._setupEventListeners();
	}

	_setupEventListeners() {
		document.onkeyup = (e) => {
			if (this.visible && e.key === 'Escape') {
				this.close();
			}
		};

		this.element.onclick = (e) => {
			const modalInner = this.element.querySelector('.inner');
			let node = e.target;
			while (node && node !== this.element) {
				if (node === modalInner) return;
				node = node.parentNode;
			}
			this.close();
		};

		this.element.querySelector('.close').onclick = () => this.close();
	}

	open() {
		this.element.classList.add('visible');
		this.visible = true;
	}

	close() {
		this.element.classList.remove('visible');
		this.visible = false;
	}
}
