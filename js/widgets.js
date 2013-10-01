'use strict';

Saillog.Widget = L.Class.extend({
	includes: L.Mixin.Events,

	initialize: function (container) {
		this._container = container;
	},

	isAuthorized: Saillog.util.isDev(),

	show: function () {
		this._container.show();
		return this;
	},

	hide: function () {
		this._container.hide();
		return this;
	},

	update: function () {
		return this;
	},

	render: function () {
		return this;
	}
});

Saillog.Widget.Index = Saillog.Widget.extend({
	update: function (index) {
		this._index = index;
		return this.render();
	},

	render: function () {
		var container = this._container.empty();
		if (!this._index) {
			container.html('No index loaded');
			return;
		}
		var index = this._index;

		$('<h1></h1>')
			.html(index.title)
			.appendTo(container);

		if (index.text) {
			$('<div class="preface"></div>')
				.html(marked(index.text))
				.appendTo(container);
		}

		var list = $('<ul class="selector"></ul>').appendTo(container);
		$.each(index.logs, function (key, log) {
			if (!log.visible && !Saillog.util.isDev()) {
				return;
			}
			var item = $('<li data-id="' + log.id + '">' + log.title + '</li>').appendTo(list);
			if (!log.visible) {
				item.addClass('disabled');
			}
		});
		var widget = this;
		list.on('click', '[data-id]', function () {
			widget.fire('click-story', {
				id: $(this).data('id')
			});
		});

		if (this.isAuthorized) {
			$('<li class="button create"><i class="icon-plus"></i> New story</li>')
				.on('click', function () {

					widget.fire('create-story', {
						id: window.prompt('Name?')
					});
				})
				.prependTo(list);
		}

		return this;
	}
});

Saillog.Widget.Story = Saillog.Widget.extend({
	update: function (story) {
		this._story = story;
		return this.render();
	},

	updateLeg: function (leg) {
		console.log(leg);
		throw 'not implemented';
	},

	render: function () {
		var container = this._container.empty();
		var story = this._story;

		var widget = this;

		var title = $('<h1></h1>').html(story.title).appendTo(container);

		if (this.isAuthorized) {
			$('<span class="edit hidden"><i class="icon-edit-sign"></i></span>')
				.on('click', function () {
					widget.fire('edit-metadata');
				})
				.appendTo(title);
			$('<button class="create"><i class="icon-plus"></i></button>')
				.on('click', function () {
					widget.fire('create-leg');
				})
				.appendTo(title);
		}

		story.each(function (leg) {
			this._renderLeg(leg.properties)
				.attr('id', 'leg-story-' + leg.properties.id)
				.appendTo(container);
		}, this);

		container.on('click mouseover mouseout', '.leg', function (event) {
			var target = $(event.target);
			var type = target.is('.edit') || target.parent().is('.edit') ? 'edit' : event.type;
			if (type === 'edit') {
				if (event.type !== 'click') {
					return;
				}
			}
			widget.fire(type + '-leg', {
				legId: $(this).attr('id').substr(10)
			});
		});
	},

	highlight: function (id) {
		var legs = this._container.find('.leg');
		if (!id) {
			legs.removeClass('active');
		}
		var current = legs.filter('#leg-story-' + id);

		if (current.hasClass('active')) {
			return;
		}
		legs.removeClass('active');
		current.addClass('active');
	},

	_renderLeg: function (leg) {
		var element = $('<div class="leg">');

		var title = $('<h3></h3>').appendTo(element);
		if (leg.title) {
			title.append(leg.title);
		}
		if (this.isAuthorized) {
			if (title.html() === '') {
				title.append('untitled');
			}
			title.append('<span class="edit hidden"><i class="icon-edit-sign"></i></span>');
		}

		if (leg.distance) {
			var tooltip = 'gevaren ';
			if (leg.duration) {
				tooltip += 'in ' + Saillog.util.formatDuration(leg.duration) + ' uur';
			}
			if (leg['avg_sog']) {
				tooltip += ', met een gemiddelde snelheid van ' + leg['avg_sog'] + 'kts';
			}
			title.append('<span class="distance" title="' + tooltip + '">' +
				Saillog.util.formatDistance(leg.distance) + ' NM</span>');
		}

		if (leg.date) {
			var parts = leg.date.split('-');
			var date = parseInt(parts[2], 10) + '-' + parseInt(parts[1], 10);

			element.prepend('<div class="date">' + date + '</div>');
		}

		if (leg.text !== undefined) {
			element.append(marked(leg.text));
		}

		if (leg.color) {
			var rgb = Saillog.util.hexToRgb(leg.color);
			element.css('border-left', '4px solid ' + rgb.toRgba(0.5));
		}

		return element;
	}
});

Saillog.Widget.LegEditor = Saillog.Widget.extend({

	update: function (leg) {
		this._leg = leg;
		return this.render();
	},

	render: function () {
		var widget = this;

		var container = this._container.empty();
		var editor = $('<div id="editor"><h1>Bewerken</h1></div>');

		//$('<span class="type"></span>').appendTo(editor);

		function inputGroup(name, label, type) {
			label = label || name;
			type = type || 'text';

			return $('<div class="group"></div>').append(
				$('<label for="' + name + '">' + label + '</label>'),
				$('<input type="' + type + '" name="' + name + '" />')
			);
		}

		inputGroup('title', 'Titel').appendTo(editor);
		inputGroup('date', 'Datum', 'date').appendTo(editor);

		var epicContainer = $('<div id="epiceditor" class="epiceditor"></div>');

		var resizeFn = function () {
			epicContainer.width($('#sidebar').width() + 78);
			if (widget._textEditor) {
				widget._textEditor.reflow();
			}
		};

		var resizeInterval = setInterval(resizeFn, 10);
		setTimeout(function () {
			clearInterval(resizeInterval);
		}, 2000);
		$(window).resize(resizeFn);

		$('<div class="group"></div>').append(
			$('<label for="text">Verhaal</label>'),
			epicContainer
		).appendTo(editor);

		$('<button class="save">Save</button>').appendTo(editor);
		$('<button class="cancel">Cancel</button>').appendTo(editor);

		editor.appendTo(container);

		this._textEditor = new EpicEditor({
			basePath: '/js/lib/epiceditor',
			button: false
		}).load();

		container.on('click', 'button', function () {
			var button = $(this);
			if (button.hasClass('save')) {
				widget.fire('save');
			} else if (button.hasClass('cancel')) {
				widget.fire('cancel');
			}
		});
		return this;
	},

	loadLeg: function (leg) {
		for (var key in leg) {
			this._container.find('[name=' + key + ']').val(leg[key]);
		}
		this._textEditor.importFile('story-' + leg.id, leg.text);
	},

	values: function () {
		var values = {};
		this._container.find('input').each(function () {
			var input = $(this);
			values[input.prop('name')] = input.val();
		});
		values['text'] = this._textEditor.exportFile();

		return values;
	}
});